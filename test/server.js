var fs = require('fs')
var http = require('http')
var makeHandler = require('../')
var pino = require('pino')
var rimraf = require('rimraf')

module.exports = function testServer (callback) {
  fs.mkdtemp('/tmp/', function withDirectory (ignore, directory) {
    var configuration = {
      directory: directory
    }
    var log = pino({}, fs.createWriteStream('test-server.log'))
    var server = http.createServer(makeHandler(configuration, log))
    server.listen(0, function onListening () {
      callback(this.address().port, configuration, function done () {
        server.close(function () {
          rimraf.sync(directory)
        })
      })
    })
  })
}
