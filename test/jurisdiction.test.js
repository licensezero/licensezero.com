var LICENSOR = require('./licensor')
var apiRequest = require('./api-request')
var ecb = require('ecb')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestLicensor = require('./write-test-licensor')

tape('jurisdiction', function (test) {
  server(function (port, service, close) {
    runSeries([
      writeTestLicensor.bind(null, service),
      apiRequest.bind(null, port, {
        action: 'jurisdiction',
        licensor: LICENSOR.id,
        password: LICENSOR.password,
        jurisdiction: 'US-TX'
      }),
      function (done) {
        apiRequest(port, {
          action: 'licensor',
          licensor: LICENSOR.id
        }, ecb(done, function (response) {
          test.equal(response.jurisdiction, 'US-TX', 'US-TX')
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
