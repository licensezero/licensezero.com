var fs = require('fs')
var os = require('os')
var path = require('path')
var randomNonce = require('../data/random-nonce')
var spawn = require('child_process').spawn
var wrapError = require('./wrap-error')

module.exports = function (commonmark, callback) {
  var nonce = randomNonce()
  var temporaryFile = path.join(
    os.tmpdir(), nonce + '.pdf'
  )
  var child = spawn(
    'pandoc',
    ['-f', 'markdown', '-o', temporaryFile]
  )
  child.once('close', function () {
    fs.readFile(temporaryFile, function (error, buffer) {
      if (error) return callback(wrapError('reading PDF failed', error))
      callback(null, buffer)
      fs.unlink(temporaryFile, function () { /* pass */ })
    })
  })
  child.stdin.end(commonmark)
}
