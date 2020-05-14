var readOffer = require('../../data/read-offer')
var sanitizeOffer = require('../../data/sanitize-offer')

exports.properties = {
  offerID: require('./common/offer-id')
}

exports.handler = function (log, body, end, fail) {
  readOffer(body.offerID, function (error, data) {
    if (error) {
      log.error(error)
      /* istanbul ignore else */
      if (error.userMessage) return fail(error.userMessage)
      return fail('internal error')
    }
    sanitizeOffer(data)
    end(data)
  })
}
