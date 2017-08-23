var LICENSOR = require('./licensor')
var apiRequest = require('./api-request')
var ecb = require('ecb')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestLicensor = require('./write-test-licensor')

tape('email', function (test) {
  server(function (port, service, close) {
    var newAddress = 'another@example.com'
    runSeries([
      writeTestLicensor.bind(null, service),
      function (done) {
        apiRequest(port, {
          action: 'email',
          id: LICENSOR.id,
          password: LICENSOR.password,
          email: newAddress
        }, ecb(done, function (response) {
          test.equal(response.error, false, 'false error')
          done()
        }))
        // TODO: Test a notification after e-mail change
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('email w/ bad authorization', function (test) {
  server(function (port, service, close) {
    var newAddress = 'another@example.com'
    runSeries([
      writeTestLicensor.bind(null, service),
      function (done) {
        apiRequest(port, {
          action: 'email',
          id: LICENSOR.id,
          password: 'not correct',
          email: newAddress
        }, ecb(done, function (response) {
          test.equal(response.error, 'access denied', 'access denied')
          done()
        }))
        // TODO: Test a notification after e-mail change
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})
