var LICENSOR = require('./licensor')
var apiRequest = require('./api-request')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestLicensor = require('./write-test-licensor')

// TODO: Test a notification after e-mail change

tape('email', function (test) {
  server(function (port, service, close) {
    var newAddress = 'another@example.com'
    runSeries([
      writeTestLicensor.bind(null, service),
      function (done) {
        apiRequest(port, {
          action: 'email',
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          email: newAddress
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
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

tape('email w/ bad authorization', function (test) {
  server(function (port, service, close) {
    var newAddress = 'another@example.com'
    runSeries([
      writeTestLicensor.bind(null, service),
      function (done) {
        apiRequest(port, {
          action: 'email',
          licensorID: LICENSOR.id,
          password: 'not correct',
          email: newAddress
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, 'access denied', 'access denied')
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
