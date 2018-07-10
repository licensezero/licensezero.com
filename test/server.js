var ed25519 = require('../ed25519')
var fs = require('fs')
var http = require('http')
var makeHandler = require('../')
var pino = require('pino')
var rimraf = require('rimraf')

module.exports = function testServer (/* [port,] callback */) {
  var port
  var callback
  if (arguments.length === 2) {
    port = arguments[0]
    callback = arguments[1]
  } else {
    port = 0
    callback = arguments[0]
  }
  fs.mkdtemp('/tmp/', function withDirectory (ignore, directory) {
    var keys = ed25519.keys()
    process.env.DIRECTORY = directory
    process.env.COMMISSION = 2
    process.env.PUBLIC_KEY = keys.publicKey
    process.env.PRIVATE_KEY = keys.privateKey
    var log = pino({}, fs.createWriteStream('test-server.log'))
    var server = http.createServer(makeHandler(log))
    server.listen(port, function onListening () {
      callback(this.address().port, function done () {
        server.close(function () {
          rimraf.sync(directory)
        })
      })
    })
  })
}
