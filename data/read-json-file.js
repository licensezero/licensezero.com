var fs = require('fs')
var parseJSON = require('json-parse-errback')
var runWaterfall = require('run-waterfall')

module.exports = function (file, callback) {
  runWaterfall([
    fs.readFile.bind(fs, file),
    parseJSON
  ], callback)
}
