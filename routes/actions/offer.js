var checkHomepage = require('./check-homepage')
var email = require('../../email')
var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')
var projectPath = require('../../paths/project')
var projectsListPath = require('../../paths/projects-list')
var recordAcceptance = require('../../data/record-acceptance')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var stringifyProjects = require('../../data/stringify-projects')
var uuid = require('uuid/v4')

exports.properties = {
  licensorID: require('./common/licensor-id'),
  token: { type: 'string' },
  homepage: require('./common/homepage'),
  pricing: require('./common/pricing'),
  description: require('./common/description'),
  terms: require('./common/agency-terms')
}

exports.handler = function (log, body, end, fail, lock) {
  var licensorID = body.licensorID
  var projectID = uuid()
  lock([licensorID], function (release) {
    runSeries([
      function (done) {
        runParallel([
          checkHomepage.bind(null, body),
          recordAcceptance.bind(null, {
            licensor: licensorID,
            date: new Date().toISOString()
          })
        ], done)
      },
      function writeFile (done) {
        runParallel([
          function writeProjectFile (done) {
            var file = projectPath(projectID)
            runSeries([
              mkdirp.bind(null, path.dirname(file)),
              fs.writeFile.bind(fs, file, JSON.stringify({
                projectID: projectID,
                licensor: licensorID,
                pricing: body.pricing,
                homepage: body.homepage,
                description: body.description,
                commission: parseInt(process.env.COMMISSION)
              }))
            ], done)
          },
          function appendToLicensorProjectsList (done) {
            var file = projectsListPath(licensorID)
            var content = stringifyProjects([
              {
                projectID: projectID,
                offered: new Date().toISOString(),
                retracted: null
              }
            ])
            runSeries([
              mkdirp.bind(null, path.dirname(file)),
              fs.appendFile.bind(fs, file, content)
            ], done)
          }
        ], done)
      }
    ], release(function (error) {
      /* istanbul ignore if */
      if (error) {
        log.error(error)
        /* istanbul ignore else */
        if (error.userMessage) return fail(error.userMessage)
        return fail('internal error')
      }
      end({ projectID: projectID })
      email(log, {
        to: process.env.OFFER_NOTIFICATION_EMAIL,
        subject: 'License Zero Project Offer',
        text: [
          [
            'projectID: ' + projectID,
            'licensor: ' + licensorID,
            'pricing:',
            '  private: ' + body.pricing.private,
            '  relicense: ' + body.pricing.relicense,
            'homepage: ' + body.homepage,
            'description: ' + body.description,
            'commission: ' + parseInt(process.env.COMMISSION)
          ].join('\n')
        ]
      }, function (error) {
        if (error) log.error(error)
      })
    }))
  })
}
