var path = require('path')
var purchasesPath = require('./purchases')

module.exports = function (uuid) {
  return path.join(purchasesPath(), uuid + '.json')
}
