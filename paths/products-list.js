var licensorPath = require('../licensor')
var path = require('path')

module.exports = function (service, id) {
  return path.join(licensorPath(service, id), 'products')
}
