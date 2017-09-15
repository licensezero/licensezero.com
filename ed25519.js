var sodium = require('sodium-native')

module.exports = {
  keys: function () {
    var publicKey = Buffer.alloc(32)
    var secretKey = Buffer.alloc(64)
    sodium.crypto_sign_keypair(publicKey, secretKey)
    return {
      privateKey: secretKey.toString('hex'),
      publicKey: publicKey.toString('hex')
    }
  },
  sign: function (message, publicKey, privateKey) {
    var signature = Buffer.alloc(64)
    sodium.crypto_sign_detached(
      signature,
      Buffer.from(message, 'utf8'),
      Buffer.from(privateKey, 'hex')
    )
    return signature.toString('hex')
  },
  verify: function (message, signature, publicKey) {
    return sodium.crypto_sign_verify_detached(
      Buffer.from(signature, 'hex'),
      Buffer.from(message, 'utf8'),
      Buffer.from(publicKey, 'hex')
    )
  }
}
