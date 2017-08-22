var crypto = require('crypto')
var ed25519 = require('ed25519')

module.exports = function generateKeypair () {
  return ed25519.MakeKeypair(crypto.randomBytes(32))
}
