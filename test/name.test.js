var LICENSOR = require('./licensor')
var apiRequest = require('./api-request')
var ecb = require('ecb')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestLicensor = require('./write-test-licensor')

tape('name', function (test) {
  server(function (port, service, close) {
    var newName = 'Someone Else'
    runSeries([
      writeTestLicensor.bind(null, service),
      apiRequest.bind(null, port, {
        action: 'name',
        licensor: LICENSOR.id,
        password: LICENSOR.password,
        name: newName
      }),
      function (done) {
        apiRequest(port, {
          action: 'licensor',
          licensor: LICENSOR.id
        }, ecb(done, function (response) {
          test.equal(response.name, newName, 'name updated')
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
