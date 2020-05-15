var mutateJSONFile = require('../../data/mutate-json-file')
var offerPath = require('../../paths/offer')
var readJSONFile = require('../../data/read-json-file')

exports.properties = {
  developerID: require('./common/developer-id'),
  token: { type: 'string' },
  offerID: require('./common/offer-id'),
  pricing: require('./common/pricing')
}

exports.handler = function (log, body, end, fail, lock) {
  lock([body.developerID, body.offerID], function (release) {
    var file = offerPath(body.offerID)
    readJSONFile(file, function (error, offer) {
      if (error) return die('no such offer')
      if (offer.retracted) return die('retracted offer')
      if (offer.relicensed) return die('relicensed offer')
      if (offer.lock) {
        var unlockDate = new Date(offer.lock.unlock)
        var now = new Date()
        if (unlockDate > now) {
          var lockedPrivateLicensePrice = offer.lock.price
          var newPrivateLicensePrice = body.pricing.private
          if (newPrivateLicensePrice > lockedPrivateLicensePrice) {
            return die('above locked price')
          }
        }
      }
      mutateJSONFile(file, function (data) {
        data.pricing = body.pricing
      }, release(function (error) {
        if (error) {
          log.error(error)
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
