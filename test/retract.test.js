var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
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
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          product = response.product
          done()
        })
      },
      function retract (done) {
        apiRequest(port, {
          action: 'retract',
          productID: product,
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          done()
        })
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
          productID: uuid(),
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error, 'no such product',
            'no such product'
          )
          done()
        })
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})
