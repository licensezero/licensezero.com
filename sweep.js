var buysPath = require('./paths/buys')
var ecb = require('ecb')
var expired = require('./data/expired')
var fs = require('fs')
var parseJSON = require('json-parse-errback')
var path = require('path')
var runParallel = require('run-parallel')

module.exports = function (service, callback) {
  var directory = buysPath(service)
  fs.readdir(directory, ecb(callback, function (entries) {
    runParallel(entries.map(function (entry) {
      return function (done) {
        var file = path.join(directory, entry)
        fs.readFile(file, ecb(done, function (buffer) {
          parseJSON(buffer, ecb(done, function (parsed) {
            if (expired(parsed.date)) {
              fs.unlink(file, done)
            } else {
              done()
            }
          }))
        }))
      }
    }), callback)
  }))
}
