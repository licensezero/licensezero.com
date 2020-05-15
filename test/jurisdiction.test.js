var developer = require('./developer')
var apiRequest = require('./api-request')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestDeveloper = require('./write-test-developer')

tape('jurisdiction', function (test) {
  server(function (port, close) {
    runSeries([
      writeTestDeveloper.bind(null),
      apiRequest.bind(null, port, {
        action: 'jurisdiction',
        developerID: developer.id,
        token: developer.token,
        jurisdiction: 'US-TX'
      }),
      function (done) {
        apiRequest(port, {
          action: 'developer',
          developerID: developer.id
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.jurisdiction, 'US-TX', 'US-TX')
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
