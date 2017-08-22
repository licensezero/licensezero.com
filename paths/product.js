var licensorPath = require('./licensor')
var path = require('path')

module.exports = function (service, id, product) {
  return path.join(licensorPath(service, id), 'products', product)
}
