var UUID = new RegExp(require('../data/uuidv4-pattern'))
var doNotCache = require('do-not-cache')
var formatPrice = require('../util/format-price')
var path = require('path')
var readOffer = require('../data/read-offer')
var withCached = require('../data/with-cached')

var withRelicense = withCached(
  path.join(__dirname, '..', 'static', 'badge-with-relicense.svg')
)

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
  readOffer(offerID, function (error, project) {
    if (error) {
      response.statusCode = 404
      return response.end()
    }
    var pricing = project.pricing
    var hasRelicense = pricing.relicense
    var withTemplate = hasRelicense ? withRelicense : withoutRelicense
    withTemplate(function (error, template) {
      /* istanbul ignore if */
      if (error) {
        response.statusCode = 500
        return response.end()
      }
      var svg = template
      svg = svg.replace('{private}', formatPrice(pricing.private))
      if (hasRelicense) {
        svg = svg.replace('{relicense}', formatPrice(pricing.relicense))
      }
      response.setHeader('Content-Type', 'image/svg+xml')
      response.end(svg)
    })
  })
}
