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
  licensorID: require('./common/licensor-id'),
  token: { type: 'string' },
  offerID: require('./common/offer-id')
}

exports.handler = function (log, body, end, fail, lock) {
  var licensorID = body.licensorID
  var offerID = body.offerID
  lock([licensorID, offerID], function (release) {
    var file = offerPath(body.offerID)
    readJSONFile(file, function (error, project) {
      if (error) return die('no such project')
      if (project.retracted) return die('retracted project')
      if (project.relicensed) return die('relicensed project')
      if (project.lock) {
        var unlockDate = new Date(project.lock.unlock)
        var now = new Date()
        if (unlockDate > now) return die('locked project')
      }
      runSeries([
        function markRetracted (done) {
          var file = offerPath(offerID)
          mutateJSONFile(file, function (data) {
            data.retracted = true
          }, annotateENOENT('no such project', done))
        },
        function removeFromProjectsList (done) {
          var file = offersListPath(licensorID)
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
