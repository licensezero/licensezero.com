var UUID = new RegExp(require('../data/uuidv4-pattern'))
var doNotCache = require('do-not-cache')
var formatPrice = require('../util/format-price')
var path = require('path')
var readOffer = require('../data/read-offer')
var withCached = require('../data/with-cached')

var withoutRelicense = withCached(
  path.join(__dirname, '..', 'static', 'badge-without-relicense.svg')
)

module.exports = function (request, response) {
  var offerID = request.parameters.offerID
  doNotCache(response)
  if (!UUID.test(offerID)) {
    response.statusCode = 404
    return response.end()
  }
  readOffer(offerID, function (error, offer) {
    if (error) {
      response.statusCode = 404
      return response.end()
    }
    var pricing = offer.pricing
    withoutRelicense(function (error, template) {
      /* istanbul ignore if */
      if (error) {
        response.statusCode = 500
        return response.end()
      }
      var svg = template
      svg = svg.replace('{private}', formatPrice(pricing.private))
      response.setHeader('Content-Type', 'image/svg+xml')
      response.end(svg)
    })
  })
}
