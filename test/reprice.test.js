var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestLicensor = require('./write-test-licensor')

tape('reprice', function (test) {
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
      function reprice (done) {
        apiRequest(port, {
          action: 'reprice',
          productID: product,
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          pricing: {
            solo: 1000,
            team: 1000,
            company: 1000,
            enterprise: 1000
          }
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
