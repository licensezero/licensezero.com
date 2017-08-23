var path = require('path')
var buysPath = require('./buys')

module.exports = function (service, uuid) {
  return path.join(buysPath(service), uuid)
}
