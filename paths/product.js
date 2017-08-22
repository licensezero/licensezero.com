var licensorPath = require('./licensor')
var path = require('path')

module.exports = function (service, product) {
  return path.join(service.directory, 'products', product)
}
