var sodium = require('sodium').api

module.exports = {
  keys: function () {
    var buffers = sodium.crypto_sign_keypair()
    return {
      privateKey: buffers.secretKey.toString('hex'),
      publicKey: buffers.publicKey.toString('hex')
    }
  },
  sign: function (message, publicKey, privateKey) {
    return sodium.crypto_sign_detached(
      Buffer.from(message, 'utf8'),
      Buffer.from(privateKey, 'hex')
    ).toString('hex')
  },
  verify: function (message, signature, publicKey) {
    return sodium.crypto_sign_verify_detached(
      Buffer.from(signature, 'hex'),
      Buffer.from(message, 'utf8'),
      Buffer.from(publicKey, 'hex')
    )
  }
}
