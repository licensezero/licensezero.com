var fs = require('fs')

module.exports = function (file) {
  var cached
  return function (callback) {
    if (cached) {
      setImmediate(function () {
        callback(null, cached)
      })
    } else {
      fs.readFile(file, 'utf8', function (error, template) {
        if (error) return callback(error)
        cached = template
        callback(null, template)
      })
    }
  }
}
