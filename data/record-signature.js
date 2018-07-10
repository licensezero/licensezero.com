var fs = require('fs')
var signaturesPath = require('../paths/signatures')

module.exports = function (publicKey, signature, callback) {
  fs.appendFile(
    signaturesPath(),
    publicKey + ' ' + signature + '\n',
    callback
  )
}
