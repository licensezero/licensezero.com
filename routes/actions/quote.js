var UUIDV4 = require('../../data/uuidv4-pattern')
var ecb = require('ecb')
var fs = require('fs')
var licensorPath = require('../../paths/licensor')
var parseJSON = require('json-parse-errback')
var productPath = require('../../paths/product')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var runWaterfall = require('run-waterfall')

exports.schema = {
  properties: {
    products: {
      type: 'array',
      minItems: 1,
      // TODO: Revisit quote products limit
      maxItems: 100,
      items: {
        description: 'product id',
        type: 'string',
        pattern: UUIDV4
      }
    }
  }
}

exports.handler = function (body, service, end, fail, lock) {
  var products = body.products
  var licensorsCache = {}
  var results = new Array(products.length)
  runParallel(
    products.map(function (product, index) {
      return function writeResult (done) {
        var productData
        var licensorData
        runSeries([
          function readProductData (done) {
            runWaterfall([
              function (done) {
                var file = productPath(service, product)
                fs.readFile(file, function (error, buffer) {
                  if (error && error.code === 'ENOENT') {
                    error.userMessage = 'no such product: ' + product
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
          function readLicensorData (done) {
            var id = productData.id
            /* istanbul ignore if */
            if (licensorsCache.hasOwnProperty(id)) {
              licensorData = licensorsCache[id]
              done()
            } else {
              var file = licensorPath(service, productData.id)
              runWaterfall([
                fs.readFile.bind(fs, file),
                parseJSON
              ], ecb(done, function (parsed) {
                licensorsCache[id] = parsed
                licensorData = parsed
                done()
              }))
            }
          }
        ], ecb(done, function write () {
          results[index] = productData.retracted
            ? {
              product: product,
              retracted: true
            }
            : {
              product: product,
              price: productData.price,
              term: productData.term,
              grace: productData.grace,
              jurisdictions: productData.jurisdictions,
              preorder: productData.preorder,
              licensor: {
                name: licensorData.name,
                jurisdiction: licensorData.jurisdiction
              }
            }
          done()
        }))
      }
    }),
    function (error) {
      if (error) {
        /* istanbul ignore else */
        if (error.userMessage) {
          fail(error.userMessage)
        } else {
          fail('internal error')
        }
      } else {
        end({products: results})
      }
    }
  )
}
