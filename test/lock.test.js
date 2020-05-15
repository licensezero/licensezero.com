var developer = require('./developer')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestDeveloper = require('./write-test-developer')

tape('lock', function (test) {
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
      function lock (done) {
        var unlock = new Date()
        unlock.setDate(unlock.getDate() + 8)
        apiRequest(port, {
          action: 'lock',
          offerID,
          developerID: developer.id,
          token: developer.token,
          unlock: unlock.toISOString()
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'locked')
          done()
        })
      },
      function decreasePrice (done) {
        apiRequest(port, {
          action: 'reprice',
          offerID,
          developerID: developer.id,
          token: developer.token,
          pricing: {
            private: OFFER.pricing.private - 100
          }
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'decreased price')
          done()
        })
      },
      function tryToIncreasePrice (done) {
        apiRequest(port, {
          action: 'reprice',
          offerID,
          developerID: developer.id,
          token: developer.token,
          pricing: {
            private: OFFER.pricing.private + 100
          }
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error, 'above locked price',
            'error: above locked'
          )
          done()
        })
      },
      function tryToRetract (done) {
        apiRequest(port, {
          action: 'retract',
          offerID,
          developerID: developer.id,
          token: developer.token
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error, 'locked offer',
            'error: locked'
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
