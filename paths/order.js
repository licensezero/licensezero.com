var path = require('path')
var ordersPath = require('./orders')

module.exports = function (uuid) {
  return path.join(ordersPath(), uuid + '.json')
}
