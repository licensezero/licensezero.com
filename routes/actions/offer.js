var checkRepository = require('./check-repository')
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
  token: {type: 'string'},
  repository: require('./common/repository'),
  pricing: require('./common/pricing'),
  description: require('./common/description'),
  terms: require('./common/agency-terms')
}

exports.handler = function (body, service, end, fail, lock) {
  var licensorID = body.licensorID
  var projectID = uuid()
  lock([licensorID], function (release) {
    runSeries([
      function (done) {
        runParallel([
          checkRepository.bind(null, body),
          recordAcceptance.bind(null, service, {
            licensor: licensorID,
            date: new Date().toISOString()
          })
        ], done)
      },
      function writeFile (done) {
        runParallel([
          function writeProjectFile (done) {
            var file = projectPath(service, projectID)
            runSeries([
              mkdirp.bind(null, path.dirname(file)),
              fs.writeFile.bind(fs, file, JSON.stringify({
                projectID: projectID,
                licensor: licensorID,
                pricing: body.pricing,
                repository: body.repository,
                description: body.description,
                commission: service.commission
              }))
            ], done)
          },
          function appendToLicensorProjectsList (done) {
            var file = projectsListPath(service, licensorID)
            var content = stringifyProjects([
              {
                project: projectID,
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
        service.log.error(error)
        /* istanbul ignore else */
        if (error.userMessage) {
          fail(error.userMessage)
        } else {
          fail('internal error')
        }
      } else {
        end({project: projectID})
      }
    }))
  })
}
