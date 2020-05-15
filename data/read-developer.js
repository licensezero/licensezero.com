var developerPath = require('../paths/developer')
var fs = require('fs')
var parseJSON = require('json-parse-errback')
var runWaterfall = require('run-waterfall')

module.exports = function (developerID, callback) {
  runWaterfall([
    fs.readFile.bind(fs, developerPath(developerID)),
    parseJSON
  ], callback)
}
