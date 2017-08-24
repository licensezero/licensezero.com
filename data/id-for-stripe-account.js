var accountsPath = require('../paths/accounts')
var flushWriteStream = require('flush-write-stream')
var fs = require('fs')
var pump = require('pump')
var split2 = require('split2')

module.exports = function (service, stripeID, callback) {
  var readStream = fs.createReadStream(accountsPath(service))
  var destroyed
  pump(
    readStream,
    split2(),
    flushWriteStream.obj(function (line, _, done) {
      if (line.indexOf(stripeID) === 0) {
        readStream.destroy()
        destroyed = true
        callback(line.split('\t')[1])
      }
      done()
    }),
    function (error) {
      if (!destroyed && error) {
        callback(error)
      }
    }
  )
}
