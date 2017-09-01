var supercop = require('ed25519-supercop')

module.exports = {
  keys: function () {
    var buffers = supercop.createKeyPair(supercop.createSeed())
    return {
      privateKey: buffers.secretKey.toString('hex'),
      publicKey: buffers.publicKey.toString('hex')
    }
  },
  sign: function (message, publicKey, privateKey) {
    return supercop.sign(message, publicKey, privateKey)
      .toString('hex')
  },
  verify: function (message, signature, publicKey) {
    return supercop.verify(signature, message, publicKey)
      .toString('hex')
  }
}
