var fs = require('fs')
var runWaterfall = require('run-waterfall')

module.exports = function (file, mutate, callback) {
  runWaterfall([
    fs.readFile.bind(fs, file, 'utf8'),
    function (buffer, done) {
      fs.writeFile(file, mutate(buffer), done)
    }
  ], callback)
}
