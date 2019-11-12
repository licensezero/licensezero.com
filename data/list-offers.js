var fs = require('fs')
var parseOffers = require('./parse-offers')
var offersListPath = require('../paths/offers-list')

module.exports = function (id, callback) {
  var file = offersListPath(id)
  fs.readFile(file, function (error, buffer) {
    if (error) {
      /* istanbul ignore else */
      if (error.code === 'ENOENT') return callback(null, [])
      return callback(error)
    }
    callback(null, parseOffers(buffer))
  })
}
