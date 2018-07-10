var path = require('path')
var resetTokensPath = require('./reset-tokens')

module.exports = function (token) {
  return path.join(resetTokensPath(), token)
}
