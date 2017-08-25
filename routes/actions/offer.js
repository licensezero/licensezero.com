var checkRepository = require('./check-repository')
var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')
var productPath = require('../../paths/product')
var productsListPath = require('../../paths/products-list')
var recordAcceptance = require('../../data/record-acceptance')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var stringifyProducts = require('../../data/stringify-products')
var uuid = require('uuid/v4')

exports.properties = {
  licensorID: require('./common/licensor-id'),
  password: {type: 'string'},
  repository: {
    description: 'source code repository',
    type: 'string',
    format: 'uri',
    pattern: '^(https|http)://'
  },
  pricing: require('./common/pricing'),
  grace: {
    description: 'number of calendar days grace period',
    type: 'integer',
    min: 7, // one week
    max: 365 // one year
  },
  description: {
    type: 'string',
    minLength: 8,
    maxLength: 144
  },
  terms: require('./common/terms')
}

exports.handler = function (body, service, end, fail, lock) {
  var licensorID = body.licensorID
  var productID = uuid()
  lock([licensorID], function (release) {
    runSeries([
      function (done) {
        runParallel([
          checkRepository.bind(null, body),
          recordAcceptance.bind(null, service, {
            licensor: licensorID,
            date: new Date().toISOString()
          })
        ], done)
      },
      function writeFile (done) {
        runParallel([
          function writeProductFile (done) {
            var file = productPath(service, productID)
            runSeries([
              mkdirp.bind(null, path.dirname(file)),
              fs.writeFile.bind(fs, file, JSON.stringify({
                productID: productID,
                licensor: licensorID,
                pricing: body.pricing,
                grace: body.grace,
                repository: body.repository,
                description: body.description
              }))
            ], done)
          },
          function appendToLicensorProductsList (done) {
            var file = productsListPath(service, licensorID)
            var content = stringifyProducts([
              {
                product: productID,
                offered: new Date().toISOString(),
                retracted: null
              }
            ])
            runSeries([
              mkdirp.bind(null, path.dirname(file)),
              fs.appendFile.bind(fs, file, content)
            ], done)
          }
        ], done)
      }
    ], release(function (error) {
      /* istanbul ignore if */
      if (error) {
        service.log.error(error)
        /* istanbul ignore else */
        if (error.userMessage) {
          fail(error.userMessage)
        } else {
          fail('internal error')
        }
      } else {
        end({product: productID})
      }
    }))
  })
}
