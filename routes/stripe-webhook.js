var TESTING = process.env.NODE_ENV === 'test'
var idForStripeAccount = require('../data/id-for-stripe-account')
var licensorPath = require('../paths/licensor')
var mutateJSONFile = require('../data/mutate-json-file')
var stripe = require('stripe')

var REQUEST_BODY_LIMIT = 1024

module.exports = function (request, response) {
  parseBodyAndRespond()

  function parseBodyAndRespond () {
    var chunks = []
    var bytesReceived = 0
    var destroyed
    request
      .on('data', function (chunk) {
        chunks.push(chunk)
        bytesReceived += chunk.length
        if (bytesReceived > REQUEST_BODY_LIMIT) {
          destroyed = true
          request.destroy()
        }
      })
      .once('error', /* istanbul ignore next */ function (error) {
        request.log.error(error)
      })
      .once('end', function () {
        if (destroyed) return
        respond(Buffer.concat(chunks))
      })
  }

  function respond (body) {
    // Use the Stripe library to verify the event signature and a fairly
    // current timestamp.
    try {
      var event = stripe.webhooks.constructEvent(
        body, request.headers['stripe-signature'],
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (error) {
      request.log.error(error)
      return
    }
    // If we're running in offer, we may still receive testing-mode
    // events.  Ignore them.
    if (!TESTING && event.livemode === false) {
      return
    }
    if (event.type === 'account.application.deauthorized') {
      idForStripeAccount(
        event.account,
        function (error, licensorID) {
          if (error) {
            request.log.error(error)
            response.statusCode = 500
            return response.end()
          }
          if (licensorID) {
            var file = licensorPath(licensorID)
            mutateJSONFile(file, function (data) {
              data.deauthorized = true
            }, function (error) {
              if (error) {
                request.log.error(error)
                response.statusCode = 500
                return response.end()
              }
              response.statusCode = 204
              return response.end()
            })
          }
          request.log.error({
            stripe: event.account
          }, 'could not find licensor ID')
          response.statusCode = 500
          response.end()
        }
      )
    }
  }
}
