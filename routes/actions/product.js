var UUIDV4 = require('../../data/uuidv4-pattern')
var ecb = require('ecb')
var fs = require('fs')
var licensorPath = require('../../paths/licensor')
var parseJSON = require('json-parse-errback')
var pick = require('../../data/pick')
var productPath = require('../../paths/product')
var runWaterfall = require('run-waterfall')
var without = require('../../data/without')

exports.schema = {
  properties: {
    product: {
      description: 'product id',
      type: 'string',
      pattern: UUIDV4
    }
  }
}

exports.handler = function (body, service, end, fail) {
  runWaterfall([
    function readProduct (done) {
      var file = productPath(service, body.product)
      fs.readFile(file, function (error, buffer) {
        if (error && error.code === 'ENOENT') {
          error.userMessage = 'no such product'
        }
        done(error, buffer)
      })
    },
    parseJSON,
    function readLicensor (productData, done) {
      var file = licensorPath(service, productData.id)
      fs.readFile(file, ecb(done, function (read) {
        parseJSON(read, ecb(done, function (licensorData) {
          done(null, productData, licensorData)
        }))
      }))
    }
  ], function (error, product, licensor) {
    if (error) {
      service.log.error(error)
      /* istanbul ignore else */
      if (error.userMessage) {
        fail(error.userMessage)
      } else {
        fail('internal error')
      }
    } else {
      var data = without(product, ['id'])
      data.licensor = pick(licensor, ['name', 'email', 'jurisdiction'])
      end(data)
    }
  })
}
