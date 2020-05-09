var apiRequest = require('./api-request')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')

tape('suspended', function (test) {
  server(function (port, close) {
    runSeries([
      function publicLicense (done) {
        apiRequest(port, {
          action: 'suspended'
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error, false,
            'error false'
          )
          test.assert(
            Array.isArray(response.suspended),
            'array'
          )
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
