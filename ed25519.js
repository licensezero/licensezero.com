var crypto = require('crypto')
var ed25519 = require('ed25519')

module.exports = {
  keys: function () {
    var buffers = ed25519.MakeKeypair(crypto.randomBytes(32))
    return {
      privateKey: buffers.privateKey.toString('hex'),
      publicKey: buffers.publicKey.toString('hex')
    }
  },
  sign: function (message, privateKey) {
    return ed25519.Sign(
      coerceUTF8(message),
      coerceHex(privateKey)
    ).toString('hex')
  },
  verify: function (message, signature, publicKey) {
    return ed25519.Verify(
      coerceUTF8(message),
      coerceHex(signature),
      coerceHex(publicKey)
    ).toString('hex')
  }
}

function coerceUTF8 (argument) {
  return Buffer.isBuffer(argument)
    ? argument
    : Buffer.from(argument, 'utf8')
}

function coerceHex (argument) {
  return Buffer.isBuffer(argument)
    ? argument
    : Buffer.from(argument, 'hex')
}
