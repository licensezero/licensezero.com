var path = require('path')
var purchasesPath = require('./purchases')

module.exports = function (service, uuid) {
  return path.join(purchasesPath(service), uuid + '.json')
}
