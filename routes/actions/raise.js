var mutateJSONFile = require('../../data/mutate-json-file')
var offerPath = require('../../paths/offer')
var readJSONFile = require('../../data/read-json-file')

exports.properties = {
  developerID: require('./common/developer-id'),
  token: { type: 'string' },
  offerID: require('./common/offer-id'),
  commission: {
    type: 'integer',
    minimum: 0,
    maximum: 50
  }
}

exports.handler = function (log, body, end, fail, lock) {
  lock([body.developerID, body.offerID], function (release) {
    var file = offerPath(body.offerID)
    readJSONFile(file, function (error, offer) {
      if (error) return die('no such offer')
      if (offer.retracted) return die('retracted offer')
      var newCommission = body.commission
      var minimum = offer.minimumCommission
      if (minimum && newCommission < minimum) {
        return die('below minimum commission')
      }
      mutateJSONFile(file, function (data) {
        if (!minimum) data.minimumCommission = data.commission
        data.commission = newCommission
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
