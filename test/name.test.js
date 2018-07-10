var LICENSOR = require('./licensor')
var apiRequest = require('./api-request')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestLicensor = require('./write-test-licensor')

tape('name', function (test) {
  server(function (port, close) {
    var newName = 'Someone Else'
    runSeries([
      writeTestLicensor.bind(null),
      apiRequest.bind(null, port, {
        action: 'name',
        licensorID: LICENSOR.id,
        token: LICENSOR.token,
        name: newName
      }),
      function (done) {
        apiRequest(port, {
          action: 'licensor',
          licensorID: LICENSOR.id
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.name, newName, 'name updated')
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
