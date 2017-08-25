var fs = require('fs')
var signaturesPath = require('../paths/signatures')

module.exports = function (service, publicKey, signature, callback) {
  fs.appendFile(
    signaturesPath(service),
    publicKey + ' ' + signature + '\n',
    callback
  )
}
