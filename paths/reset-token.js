var path = require('path')
var resetTokensPath = require('./reset-tokens')

module.exports = function (service, token) {
  return path.join(resetTokensPath(service), token)
}
