var mutateJSONFile = require('../../data/mutate-json-file')
var offerPath = require('../../paths/offer')
var readJSONFile = require('../../data/read-json-file')

exports.properties = {
  licensorID: require('./common/licensor-id'),
  token: { type: 'string' },
  offerID: require('./common/offer-id'),
  unlock: {
    type: 'string',
    format: 'date-time'
  }
}

exports.handler = function (log, body, end, fail, lock) {
  lock([body.licensorID, body.offerID], function (release) {
    var file = offerPath(body.offerID)
    readJSONFile(file, function (error, offer) {
      if (error) return die('no such offer')
      if (offer.retracted) return die('retracted offer')
      if (offer.relicensed) return die('relicensed offer')
      // Unlock Date Validation
      var proposedUnlock = new Date(body.unlock)
      var minimumUnlock = minimumUnlockDate()
      if (proposedUnlock < minimumUnlock) return die('invalid unlock')
      var maximumUnlock = maximumUnlockDate()
      if (proposedUnlock > maximumUnlock) return die('invalid unlock')
      // If the offer is already locked, ensure the
      // proposed lock date is after the current unlock date.
      if (offer.lock) {
        var currentUnlock = new Date(offer.lock.unlock)
        if (currentUnlock >= proposedUnlock) {
          return die('already locked')
        }
      }
      mutateJSONFile(file, function (data) {
        data.lock = {
          locked: new Date().toISOString(),
          unlock: proposedUnlock.toISOString(),
          price: offer.pricing.private
        }
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

var MINIMUM_LOCK_DAYS = 7

function minimumUnlockDate () {
  var returned = new Date()
  returned.setDate(returned.getDate() + MINIMUM_LOCK_DAYS)
  return returned
}

var MAXIMUM_LOCK_DAYS = 365 * 5

function maximumUnlockDate () {
  var returned = new Date()
  returned.setDate(returned.getDate() + MAXIMUM_LOCK_DAYS)
  return returned
}
