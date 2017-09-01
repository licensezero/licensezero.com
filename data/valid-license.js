var ed25519 = require('ed25519')
var decode = require('./decode')

var REQUIRED = [
  'productID', 'manifest', 'document', 'publicKey', 'signature'
]

module.exports = function (license) {
  for (var index = 0; index < REQUIRED.length; index++) {
    if (typeof license[REQUIRED[index]] !== 'string') {
      return false
    }
  }
  return ed25519.Verify(
    Buffer.from(license.manifest + '\n\n' + license.document, 'utf8'),
    decode(license.signature),
    decode(license.publicKey)
  )
}
