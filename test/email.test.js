var developer = require('./developer')
var apiRequest = require('./api-request')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestDeveloper = require('./write-test-developer')

tape('email', function (test) {
  server(function (port, close) {
    var newAddress = 'another@example.com'
    runSeries([
      writeTestDeveloper.bind(null),
      function (done) {
        apiRequest(port, {
          action: 'email',
          developerID: developer.id,
          token: developer.token,
          email: newAddress
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          done()
        })
      }
    ], function (error) {
      test.ifError(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('email w/ bad authorization', function (test) {
  server(function (port, close) {
    var newAddress = 'another@example.com'
    runSeries([
      writeTestDeveloper.bind(null),
      function (done) {
        apiRequest(port, {
          action: 'email',
          developerID: developer.id,
          token: 'not correct',
          email: newAddress
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, 'access denied', 'access denied')
          done()
        })
      }
    ], function (error) {
      test.ifError(error, 'no error')
      test.end()
      close()
    })
  })
})
