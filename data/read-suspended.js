var fs = require('fs')
var parseJSON = require('json-parse-errback')
var suspendedPath = require('../paths/suspended')

module.exports = function (callback) {
  fs.readFile(suspendedPath(), function (error, data) {
    if (error) {
      if (error.code === 'ENOENT') return callback(null, [])
      else return callback(Error)
    }
    parseJSON(data, function (error, parsed) {
      if (error) return callback(error)
      callback(null, parsed)
    })
  })
}
