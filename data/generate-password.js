var crypto = require('crypto')
var encode = require('./encode')

module.exports = function () {
  return encode(crypto.randomBytes(32))
}
