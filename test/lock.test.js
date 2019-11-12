var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestLicensor = require('./write-test-licensor')

tape('lock', function (test) {
  server(function (port, close) {
    var offerID
    runSeries([
      writeTestLicensor.bind(null),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token
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
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
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
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
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
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
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
          licensorID: LICENSOR.id,
          token: LICENSOR.token
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error, 'locked project',
            'error: locked'
          )
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
