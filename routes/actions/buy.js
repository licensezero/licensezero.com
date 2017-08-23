var JURISDICTIONS = require('../../data/jurisdictions')
var UUIDV4 = require('../../data/uuidv4-pattern')
var buyPath = require('../../paths/buy')
var ecb = require('ecb')
var fs = require('fs')
var licensorPath = require('../../paths/licensor')
var mkdirp = require('mkdirp')
var parseJSON = require('json-parse-errback')
var path = require('path')
var productPath = require('../../paths/product')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var runWaterfall = require('run-waterfall')
var uuid = require('uuid/v4')

exports.schema = {
  properties: {
    licensee: {
      description: 'your legal name',
      type: 'string',
      minLength: 4
    },
    jurisdiction: {
      description: 'legal jurisdiction where you reside',
      type: 'string',
      enum: JURISDICTIONS
    },
    products: {
      type: 'array',
      minItems: 1,
      // TODO: Revisit buy products limit
      maxItems: 100,
      items: {
        description: 'product id',
        type: 'string',
        pattern: UUIDV4
      }
    }
  }
}

// TODO: Refactor with quote action handler.
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
              licensor: {
                name: licensorData.name,
                jurisdiction: licensorData.jurisdiction
              },
              stripe: productData.stripe
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
          service.log.error(error)
          fail('internal error')
        }
      } else {
        var retracted = results.filter(function (result) {
          return result.retracted
        })
        if (retracted.length !== 0) {
          fail('retracted products: ' + retracted
            .map(function (retracted) {
              return retracted.product
            })
            .join(', ')
          )
        } else {
          var buy = uuid()
          var stripeOrder
          var file = buyPath(service, buy)
          runSeries([
            function createStripeOrder (done) {
              service.stripe.api.orders.create({
                currency: 'usd',
                items: results.map(function (result) {
                  return {
                    type: 'sku',
                    parent: result.stripe.skus[0].id,
                    quantity: 1
                  }
                })
              }, ecb(done, function (response) {
                stripeOrder = response.id
                done()
              }))
            },
            mkdirp.bind(null, path.dirname(file)),
            fs.writeFile.bind(fs, file, JSON.stringify({
              date: new Date().toISOString(),
              licensee: body.licensee,
              jurisdiction: body.jurisdiction,
              products: results,
              stripe: {
                order: stripeOrder
              }
            }))
          ], function (error) {
            /* istanbul ignore if */
            if (error) {
              fail('internal error')
            } else {
              end({location: '/buy/' + buy})
            }
          })
        }
      }
    }
  )
}
