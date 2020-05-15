var developer = require('./developer')
var apiRequest = require('./api-request')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestDeveloper = require('./write-test-developer')

tape('name', function (test) {
  server(function (port, close) {
    var newName = 'Someone Else'
    runSeries([
      writeTestDeveloper.bind(null),
      apiRequest.bind(null, port, {
        action: 'name',
        developerID: developer.id,
        token: developer.token,
        name: newName
      }),
      function (done) {
        apiRequest(port, {
          action: 'developer',
          developerID: developer.id
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.name, newName, 'name updated')
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
