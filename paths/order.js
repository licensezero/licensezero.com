var path = require('path')
var ordersPath = require('./orders')

module.exports = function (service, uuid) {
  return path.join(ordersPath(service), uuid + '.json')
}
