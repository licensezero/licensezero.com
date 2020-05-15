var developer = require('./developer')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var uuid = require('uuid').v4
var writeTestDeveloper = require('./write-test-developer')

tape('retract', function (test) {
  server(function (port, close) {
    var offerID
    runSeries([
      writeTestDeveloper.bind(null),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          developerID: developer.id,
          token: developer.token
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          offerID = response.offerID
          done()
        })
      },
      function retract (done) {
        apiRequest(port, {
          action: 'retract',
          offerID,
          developerID: developer.id,
          token: developer.token
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
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

tape('retract nonexistent', function (test) {
  server(function (port, close) {
    runSeries([
      writeTestDeveloper.bind(null),
      function retract (done) {
        apiRequest(port, {
          action: 'retract',
          offerID: uuid(),
          developerID: developer.id,
          token: developer.token
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error, 'no such offer',
            'no such offer'
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
