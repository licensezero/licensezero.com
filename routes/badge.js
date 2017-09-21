var TIERS = require('../data/private-license-tiers')
var UUID = new RegExp(require('../data/uuidv4-pattern'))
var formatPrice = require('./format-price')
var fs = require('fs')
var path = require('path')
var readProject = require('../data/read-project')

module.exports = function (request, response, service) {
  var projectID = request.parameters.projectID
  if (!UUID.test(projectID)) {
    response.statusCode = 404
    return response.end()
  }
  readProject(service, projectID, function (error, project) {
    if (error) {
      response.statusCode = 404
      return response.end()
    }
    var file = path.join(__dirname, '..', 'static', 'badge-no-relicense.svg')
    fs.readFile(file, 'utf8', function (error, template) {
      if (error) {
        response.statusCode = 500
        return response.end()
      }
      var svg = template
      Object.keys(TIERS).forEach(function (tier) {
        svg = svg.replace('{{{' + tier + '}}}', formatPrice(project.pricing[tier]))
      })
      response.setHeader('Content-Type', 'image/svg+xml')
      response.end(svg)
    })
  })
}
