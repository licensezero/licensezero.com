var licensorPath = require('../paths/licensor')
var fs = require('fs')
var parseJSON = require('json-parse-errback')
var runWaterfall = require('run-waterfall')
var migrateLicensor = require('./migrate-licensor')

module.exports = function (licensorID, callback) {
  runWaterfall([
    fs.readFile.bind(fs, licensorPath(licensorID)),
    parseJSON
  ], function (error, read) {
    if (error) return callback(error)
    callback(null, migrateLicensor(read))
  })
}
