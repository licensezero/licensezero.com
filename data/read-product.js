var ecb = require('ecb')
var fs = require('fs')
var licensorPath = require('../paths/licensor')
var parseJSON = require('json-parse-errback')
var productPath = require('../paths/product')
var runWaterfall = require('run-waterfall')

module.exports = function (service, product, callback) {
  runWaterfall([
    function readProductData (done) {
      runWaterfall([
        function readStripeProductID (done) {
          var file = productPath(service, product)
          fs.readFile(file, function (error, buffer) {
            if (error && error.code === 'ENOENT') {
              error.userMessage = 'no such product'
            }
            done(error, buffer)
          })
        },
        parseJSON,
        function retrieveStripeProduct (id, done) {
          service.stripe.api.products.retrieve(id, done)
        }
      ], ecb(done, function (data) {
        data.metadata.grace = parseInt(data.metadata.grace)
        done(null, data)
      }))
    },
    function readLicensorData (stripe, done) {
      var id = stripe.metadata.licensor
      var file = licensorPath(service, id)
      runWaterfall([
        fs.readFile.bind(fs, file),
        parseJSON
      ], ecb(done, function (licensor) {
        licensor.id = id
        done(null, {
          licensor: licensor,
          stripe: stripe
        })
      }))
    }
  ], ecb(callback, function (results) {
    var stripe = results.stripe
    var metadata = results.stripe.metadata
    var licensor = results.licensor
    callback(null, !stripe.active
      ? {
        product: product,
        retracted: true
      }
      : {
        product: product,
        stripe: stripe,
        pricing: stripe.skus.data
          .reduce(function (pricing, sku) {
            if (sku.active) {
              pricing[sku.metadata.tier] = sku.price
            }
            return pricing
          }, {}),
        grace: metadata.grace,
        repository: metadata.repository,
        licensor: licensor
      }
    )
  }))
}
