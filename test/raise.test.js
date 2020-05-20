var DEVELOPER = require('./developer')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestDeveloper = require('./write-test-developer')

tape('raise', function (test) {
  testRaise(test, 15, function (response) {
    test.equal(response.error, false, 'error false')
  })
})

tape('raise above 100', function (test) {
  testRaise(test, 100, function (response) {
    test.equal(response.error, 'invalid body', 'invalid')
  })
})

tape('raise to negative', function (test) {
  testRaise(test, -1, function (response) {
    test.equal(response.error, 'invalid body', 'invalid')
  })
})

function testRaise (test, commission, assertions) {
  server(function (port, close) {
    var offerID
    runSeries([
      writeTestDeveloper.bind(null),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          developerID: DEVELOPER.id,
          token: DEVELOPER.token
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          offerID = response.offerID
          done()
        })
      },
      function reprice (done) {
        apiRequest(port, {
          action: 'raise',
          offerID,
          developerID: DEVELOPER.id,
          token: DEVELOPER.token,
          commission
        }, function (error, response) {
          if (error) return done(error)
          assertions(response)
          done()
        })
      }
    ], function (error) {
      test.ifError(error, 'no error')
      test.end()
      close()
    })
  })
}
