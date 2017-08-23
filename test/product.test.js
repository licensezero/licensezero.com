var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var ecb = require('ecb')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var uuid = require('uuid/v4')
var writeTestLicensor = require('./write-test-licensor')

tape('product', function (test) {
  server(function (port, service, close) {
    var product
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          id: LICENSOR.id,
          password: LICENSOR.password
        }), ecb(done, function (response) {
          test.equal(response.error, false, 'error false')
          product = response.product
          done()
        }))
      },
      function requestProduct (done) {
        apiRequest(port, {
          action: 'product',
          product: product
        }, ecb(done, function (response) {
          test.equal(response.error, false, 'false error')
          Object.keys(OFFER).forEach(function (key) {
            test.deepEqual(response[key], OFFER[key], key)
          })
          done()
        }))
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('nonexistent product', function (test) {
  server(function (port, service, close) {
    apiRequest(port, {
      action: 'product',
      product: uuid()
    }, function (error, response) {
      if (error) {
        test.error(error)
      } else {
        test.equal(response.error, 'no such product')
      }
      test.end()
      close()
    })
  })
})
