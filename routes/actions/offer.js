var checkHomepage = require('./check-homepage')
var email = require('../../email')
var fs = require('fs')
var path = require('path')
var offerPath = require('../../paths/offer')
var offersListPath = require('../../paths/offers-list')
var recordAcceptance = require('../../data/record-acceptance')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var stringifyOffers = require('../../data/stringify-offers')
var uuid = require('uuid').v4

exports.properties = {
  developerID: require('./common/developer-id'),
  token: { type: 'string' },
  homepage: require('./common/homepage'),
  pricing: require('./common/pricing'),
  description: require('./common/description'),
  terms: require('./common/agency-terms')
}

exports.handler = function (log, body, end, fail, lock) {
  var developerID = body.developerID
  var offerID = uuid()
  lock([developerID], function (release) {
    runSeries([
      function (done) {
        runParallel([
          checkHomepage.bind(null, body),
          recordAcceptance.bind(null, {
            developer: developerID,
            date: new Date().toISOString()
          })
        ], done)
      },
      function writeFile (done) {
        runParallel([
          function writeOfferFile (done) {
            var file = offerPath(offerID)
            runSeries([
              fs.mkdir.bind(fs, path.dirname(file), { recursive: true }),
              fs.writeFile.bind(fs, file, JSON.stringify({
                offerID,
                developer: developerID,
                pricing: body.pricing,
                homepage: body.homepage,
                description: body.description,
                commission: parseInt(process.env.COMMISSION)
              }))
            ], done)
          },
          function appendToDeveloperOffersList (done) {
            var file = offersListPath(developerID)
            var content = stringifyOffers([
              {
                offerID,
                offered: new Date().toISOString(),
                retracted: null
              }
            ])
            runSeries([
              fs.mkdir.bind(fs, path.dirname(file), { recursive: true }),
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
      end({ offerID })
      email(log, {
        to: process.env.OFFER_NOTIFICATION_EMAIL,
        subject: 'License Zero Offer Offer',
        text: [
          'offerID: ' + offerID,
          'developer: ' + developerID,
          'pricing.private: ' + body.pricing.private,
          'pricing.relicense: ' + body.pricing.relicense,
          'homepage: ' + body.homepage,
          'description: ' + body.description,
          'commission: ' + parseInt(process.env.COMMISSION)
        ].join('\n\n')
      }, function (error) {
        if (error) log.error(error)
      })
    }))
  })
}
