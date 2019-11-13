var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var uuid = require('uuid/v4')
var writeTestLicensor = require('./write-test-licensor')

tape('quote', function (test) {
  server(function (port, close) {
    var firstOffer
    var secondOffer
    runSeries([
      writeTestLicensor.bind(null),
      function offerFirst (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          homepage: 'http://example.com/first'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          firstOffer = response.offerID
          done()
        })
      },
      function offerSecond (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          homepage: 'http://example.com/second'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          secondOffer = response.offerID
          done()
        })
      },
      function quote (done) {
        apiRequest(port, {
          action: 'quote',
          offers: [firstOffer, secondOffer]
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          test.deepEqual(
            response.offers,
            [
              {
                offerID: firstOffer,
                description: OFFER.description,
                pricing: OFFER.pricing,
                homepage: 'http://example.com/first',
                licensor: {
                  licensorID: LICENSOR.id,
                  name: 'Test User',
                  jurisdiction: 'US-CA',
                  publicKey: LICENSOR.publicKey
                },
                commission: parseInt(process.env.COMMISSION)
              },
              {
                offerID: secondOffer,
                description: OFFER.description,
                pricing: OFFER.pricing,
                homepage: 'http://example.com/second',
                licensor: {
                  licensorID: LICENSOR.id,
                  name: 'Test User',
                  jurisdiction: 'US-CA',
                  publicKey: LICENSOR.publicKey
                },
                commission: parseInt(process.env.COMMISSION)
              }
            ],
            'quotes terms'
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

tape('quote w/ nonexistent', function (test) {
  server(function (port, close) {
    var offerID = uuid()
    apiRequest(port, {
      action: 'quote',
      offers: [offerID]
    }, function (error, response) {
      test.error(error)
      test.equal(
        response.error, 'no such offer: ' + offerID,
        'no such offer'
      )
      test.end()
      close()
    })
  })
})

tape('quote w/ retracted', function (test) {
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
      function retract (done) {
        apiRequest(port, {
          action: 'retract',
          offerID,
          licensorID: LICENSOR.id,
          token: LICENSOR.token
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'retract error false')
          done()
        })
      },
      function quote (done) {
        apiRequest(port, {
          action: 'quote',
          offers: [offerID]
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.offers[0].offerID, offerID,
            'offer'
          )
          test.equal(
            response.offers[0].retracted, true,
            'retracted'
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
