var fs = require('fs')
var parseProducts = require('./parse-products')
var productsListPath = require('../paths/products-list')

module.exports = function (service, id, callback) {
  var file = productsListPath(service, id)
  fs.readFile(file, function (error, buffer) {
    if (error) {
      /* istanbul ignore else */
      if (error.code === 'ENOENT') {
        callback(null, [])
      } else {
        callback(error)
      }
    } else {
      callback(null, parseProducts(buffer))
    }
  })
}
