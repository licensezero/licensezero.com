var ed25519 = require('../util/ed25519')

var REQUIRED = [
  'offerID', 'manifest', 'document', 'publicKey', 'signature'
]

module.exports = function (license) {
  for (var index = 0; index < REQUIRED.length; index++) {
    if (typeof license[REQUIRED[index]] !== 'string') {
      return false
    }
  }
  return ed25519.verify(
    license.manifest + '\n\n' + license.document,
    license.signature,
    license.publicKey
  )
}
