var developer = require('./developer')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var uuid = require('uuid').v4
var writeTestDeveloper = require('./write-test-developer')

tape('quote', function (test) {
  server(function (port, close) {
    var firstOffer
    var secondOffer
    runSeries([
      writeTestDeveloper.bind(null),
      function offerFirst (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          developerID: developer.id,
          token: developer.token,
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
          developerID: developer.id,
          token: developer.token,
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
                developer: {
                  developerID: developer.id,
                  name: 'Test User',
                  jurisdiction: 'US-CA'
                },
                commission: parseInt(process.env.COMMISSION)
              },
              {
                offerID: secondOffer,
                description: OFFER.description,
                pricing: OFFER.pricing,
                homepage: 'http://example.com/second',
                developer: {
                  developerID: developer.id,
                  name: 'Test User',
                  jurisdiction: 'US-CA'
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
      test.ifError(error, 'no error')
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
      test.ifError(error)
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
      test.ifError(error, 'no error')
      test.end()
      close()
    })
  })
})
