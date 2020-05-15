var annotateENOENT = require('../../data/annotate-enoent')
var mutateJSONFile = require('../../data/mutate-json-file')
var mutateTextFile = require('../../data/mutate-text-file')
var parseOffers = require('../../data/parse-offers')
var offerPath = require('../../paths/offer')
var offersListPath = require('../../paths/offers-list')
var readJSONFile = require('../../data/read-json-file')
var runSeries = require('run-series')
var stringifyOffers = require('../../data/stringify-offers')

exports.properties = {
  developerID: require('./common/developer-id'),
  token: { type: 'string' },
  offerID: require('./common/offer-id')
}

exports.handler = function (log, body, end, fail, lock) {
  var developerID = body.developerID
  var offerID = body.offerID
  lock([developerID, offerID], function (release) {
    var file = offerPath(body.offerID)
    readJSONFile(file, function (error, offer) {
      if (error) return die('no such offer')
      if (offer.retracted) return die('retracted offer')
      if (offer.relicensed) return die('relicensed offer')
      if (offer.lock) {
        var unlockDate = new Date(offer.lock.unlock)
        var now = new Date()
        if (unlockDate > now) return die('locked offer')
      }
      runSeries([
        function markRetracted (done) {
          var file = offerPath(offerID)
          mutateJSONFile(file, function (data) {
            data.retracted = true
          }, annotateENOENT('no such offer', done))
        },
        function removeFromOffersList (done) {
          var file = offersListPath(developerID)
          mutateTextFile(file, function (text) {
            return stringifyOffers(
              parseOffers(text)
                .map(function (element) {
                  if (
                    element.offerID === offerID &&
                    element.retracted === null
                  ) {
                    element.retracted = new Date().toISOString()
                  }
                  return element
                })
            )
          }, done)
        }
      ], release(function (error) {
        if (error) {
          log.error(error)
          /* istanbul ignore else */
          if (error.userMessage) return fail(error.userMessage)
          return fail('internal error')
        }
        end()
      }))
    })
    function die (message) {
      release(function () {
        fail(message)
      })()
    }
  })
}
