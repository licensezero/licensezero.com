var annotateENOENT = require('./annotate-enoent')
var ecb = require('ecb')
var licensorPath = require('../paths/licensor')
var productPath = require('../paths/product')
var readJSONFile = require('./read-json-file')
var runWaterfall = require('run-waterfall')

module.exports = function (service, productID, callback) {
  runWaterfall([
    function readProductData (done) {
      var file = productPath(service, productID)
      readJSONFile(file, annotateENOENT('no such product', done))
    },
    function readLicensorData (product, done) {
      var file = licensorPath(service, product.licensor)
      readJSONFile(file, ecb(done, function (licensor) {
        done(null, {
          licensor: licensor,
          product: product
        })
      }))
    }
  ], ecb(callback, function (results) {
    callback(null, Object.assign(results.product, {
      licensor: results.licensor
    }))
  }))
}
