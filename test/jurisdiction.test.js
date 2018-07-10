var LICENSOR = require('./licensor')
var apiRequest = require('./api-request')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestLicensor = require('./write-test-licensor')

tape('jurisdiction', function (test) {
  server(function (port, close) {
    runSeries([
      writeTestLicensor.bind(null),
      apiRequest.bind(null, port, {
        action: 'jurisdiction',
        licensorID: LICENSOR.id,
        token: LICENSOR.token,
        jurisdiction: 'US-TX'
      }),
      function (done) {
        apiRequest(port, {
          action: 'licensor',
          licensorID: LICENSOR.id
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.jurisdiction, 'US-TX', 'US-TX')
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
