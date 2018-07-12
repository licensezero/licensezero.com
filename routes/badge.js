var UUID = new RegExp(require('../data/uuidv4-pattern'))
var doNotCache = require('do-not-cache')
var formatPrice = require('./format-price')
var path = require('path')
var readProject = require('../data/read-project')
var withCached = require('../data/with-cached')

var withRelicense = withCached(
  path.join(__dirname, '..', 'static', 'badge-with-relicense.svg')
)

var withoutRelicense = withCached(
  path.join(__dirname, '..', 'static', 'badge-without-relicense.svg')
)

module.exports = function (request, response) {
  var projectID = request.parameters.projectID
  doNotCache(response)
  if (!UUID.test(projectID)) {
    response.statusCode = 404
    return response.end()
  }
  readProject(projectID, function (error, project) {
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
