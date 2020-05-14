var readOffer = require('../../data/read-offer')
var runParallel = require('run-parallel')
var sanitizeOffer = require('../../data/sanitize-offer')

exports.properties = {
  offers: {
    type: 'array',
    minItems: 1,
    maxItems: 100,
    items: require('./common/offer-id')
  }
}

exports.handler = function (log, body, end, fail, lock) {
  var offers = body.offers
  var results = new Array(offers.length)
  runParallel(
    offers.map(function (offerID, index) {
      return function (done) {
        readOffer(offerID, function (error, offer) {
          if (error) {
            if (error.userMessage) {
              error.userMessage += ': ' + offerID
            }
            return done(error)
          }
          sanitizeOffer(offer)
          results[index] = offer
          done()
        })
      }
    }),
    function (error) {
      if (error) {
        /* istanbul ignore else */
        if (error.userMessage) return fail(error.userMessage)
        return fail('internal error')
      }
      end({ offers: results })
    }
  )
}
