var crypto = require('crypto')
var ed25519 = require('ed25519')
var fs = require('fs')
var http = require('http')
var makeHandler = require('../')
var pino = require('pino')
var rimraf = require('rimraf')

module.exports = function testServer (callback) {
  fs.mkdtemp('/tmp/', function withDirectory (ignore, directory) {
    var keys = ed25519.MakeKeypair(crypto.randomBytes(32))
    var configuration = {
      directory: directory,
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
      stripe: require('../stripe-environment'),
      mailgun: require('../mailgun-environment'),
      fee: 100
    }
    var log = pino({}, fs.createWriteStream('test-server.log'))
    configuration.log = log
    var server = http.createServer(makeHandler(configuration, log))
    server.listen(8080, function onListening () {
      callback(this.address().port, configuration, function done () {
        server.close(function () {
          rimraf.sync(directory)
        })
      })
    })
  })
}
