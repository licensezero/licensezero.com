var licensorPath = require('../paths/licensor')
var fs = require('fs')
var parseJSON = require('json-parse-errback')
var runWaterfall = require('run-waterfall')

module.exports = function (service, licensorID, callback) {
  runWaterfall([
    fs.readFile.bind(fs, licensorPath(service, licensorID)),
    parseJSON
  ], callback)
}
