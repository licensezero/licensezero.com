var ecb = require('ecb')
var fs = require('fs')
var licensorPath = require('../paths/licensor')
var parseJSON = require('json-parse-errback')
var pick = require('./pick')
var productPath = require('../paths/product')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var runWaterfall = require('run-waterfall')

module.exports = function (service, product, callback) {
  var productData
  var licensorData
  runSeries([
    function readProductData (done) {
      runWaterfall([
        function (done) {
          var file = productPath(service, product)
          fs.readFile(file, function (error, buffer) {
            if (error && error.code === 'ENOENT') {
              error.userMessage = 'no such product'
            }
            done(error, buffer)
          })
        },
        parseJSON
      ], ecb(done, function (parsed) {
        productData = parsed
        done()
      }))
    },
    function (done) {
      runParallel([
        function readStripeData (done) {
          var skus = productData.stripe.skus
          var keys = Object.keys(skus)
          runParallel(
            keys
              .map(function (key) {
                return function retrieveSKU (done) {
                  service.stripe.api.skus.retrieve(
                    skus[key],
                    ecb(done, function (response) {
                      productData.stripe.skus[key] = {
                        id: response.id,
                        price: response.price,
                        count: parseInt(response.attributes.count)
                      }
                      done()
                    })
                  )
                }
              })
              .concat(function retrieveProduct (done) {
                service.stripe.api.products.retrieve(
                  productData.stripe.product,
                  ecb(done, function (response) {
                    productData.stripe.product = response.id
                    productData.retracted = !response.active
                    done()
                  })
                )
              }),
          done)
        },
        function readLicensorData (done) {
          var file = licensorPath(service, productData.id)
          runWaterfall([
            fs.readFile.bind(fs, file),
            parseJSON
          ], ecb(done, function (parsed) {
            licensorData = parsed
            licensorData.id = productData.id
            done()
          }))
        }
      ], done)
    }
  ], ecb(callback, function () {
    callback(null, productData.retracted
      ? {
        product: product,
        retracted: true
      }
      : {
        product: product,
        stripe: productData.stripe,
        pricing: Object.keys(productData.stripe.skus)
          .reduce(function (pricing, key) {
            pricing[key] = productData.stripe.skus[key].price
            return pricing
          }, {}),
        term: productData.term,
        grace: productData.grace,
        jurisdictions: productData.jurisdictions,
        repository: productData.repository,
        licensor: pick(licensorData, [
          'id', 'name', 'jurisdiction', 'publicKey'
        ])
      }
    )
  }))
}
