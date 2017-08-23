var fs = require('fs')
var productsListPath = require('../paths/products-list')

module.exports = function (service, id, callback) {
  var file = productsListPath(service, id)
  fs.readFile(file, function (error, buffer) {
    if (error) {
      if (error.code === 'ENOENT') {
        callback(null, [])
      } else {
        callback(error)
      }
    } else {
      var list = buffer
        .toString()
        .trim()
        .split('\n')
        .filter(function (element) {
          return element.length !== 0
        })
      callback(null, list)
    }
  })
}
