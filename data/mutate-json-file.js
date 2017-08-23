var fs = require('fs')
var parseJSON = require('json-parse-errback')
var runWaterfall = require('run-waterfall')

module.exports = function (file, mutate, callback) {
  runWaterfall([
    fs.readFile.bind(fs, file),
    parseJSON,
    function (data, done) {
      mutate(data)
      fs.writeFile(file, JSON.stringify(data), done)
    }
  ], callback)
}
