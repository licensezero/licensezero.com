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

tape('retract', function (test) {
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
      function retract (done) {
        apiRequest(port, {
          action: 'retract',
          product: product,
          id: LICENSOR.id,
          password: LICENSOR.password
        }, ecb(done, function (response) {
          test.equal(response.error, false, 'error false')
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

tape('retract nonexistent', function (test) {
  server(function (port, service, close) {
    runSeries([
      writeTestLicensor.bind(null, service),
      function retract (done) {
        apiRequest(port, {
          action: 'retract',
          product: uuid(),
          id: LICENSOR.id,
          password: LICENSOR.password
        }, ecb(done, function (response) {
          test.equal(
            response.error, 'no such product',
            'no such product'
          )
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
