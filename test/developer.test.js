var DEVELOPER = require('./developer')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestDeveloper = require('./write-test-developer')

tape('developer', function (test) {
  server(function (port, close) {
    writeTestDeveloper(function (error) {
      test.ifError(error)
      apiRequest(port, {
        action: 'developer',
        developerID: DEVELOPER.id
      }, function (error, response) {
        if (error) {
          test.ifError(error)
        } else {
          test.equal(
            response.error, false,
            'error false'
          )
          test.equal(
            response.name, DEVELOPER.name,
            'name'
          )
          test.equal(
            response.jurisdiction, DEVELOPER.jurisdiction,
            'jurisdiction'
          )
          test.deepEqual(
            response.offers, [],
            'offers'
          )
        }
        test.end()
        close()
      })
    })
  })
})

tape('developer w/ invalid id', function (test) {
  server(function (port, close) {
    apiRequest(port, {
      action: 'developer',
      developerID: DEVELOPER.id
    }, function (error, response) {
      if (error) {
        test.ifError(error)
      } else {
        test.equal(
          response.error, 'no such developer',
          'no such developer'
        )
      }
      test.end()
      close()
    })
  })
})

tape('developer w/ offer', function (test) {
  server(function (port, close) {
    var offerID
    runSeries([
      writeTestDeveloper.bind(null),
      function makeOffer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          developerID: DEVELOPER.id,
          token: DEVELOPER.token
        }), function (error, response) {
          if (error) return done(error)
          offerID = response.offerID
          done()
        })
      },
      function (done) {
        apiRequest(port, {
          action: 'developer',
          developerID: DEVELOPER.id
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.offers.length, 1,
            'one offer'
          )
          test.equal(
            response.offers[0].offerID, offerID,
            'made offer'
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

tape('developer w/ retracted offer', function (test) {
  server(function (port, close) {
    var offerID
    runSeries([
      writeTestDeveloper.bind(null),
      function makeOffer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          developerID: DEVELOPER.id,
          token: DEVELOPER.token
        }), function (error, response) {
          if (error) return done(error)
          offerID = response.offerID
          done()
        })
      },
      function retractOffer (done) {
        apiRequest(port, {
          action: 'retract',
          developerID: DEVELOPER.id,
          token: DEVELOPER.token,
          offerID
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          done()
        })
      },
      function listDeveloperOffers (done) {
        apiRequest(port, {
          action: 'developer',
          developerID: DEVELOPER.id
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.offers.length, 1,
            'one offer listed'
          )
          test.notEqual(
            response.offers[0].retracted, null,
            'offer retracted'
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

tape('developer w/ retracted offer', function (test) {
  server(function (port, close) {
    var firstOffer
    var secondOffer
    runSeries([
      writeTestDeveloper.bind(null),
      function offerFirstOffer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          developerID: DEVELOPER.id,
          token: DEVELOPER.token,
          homepage: 'http://example.com/first'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          firstOffer = response.offerID
          done()
        })
      },
      function offerSecondOffer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          developerID: DEVELOPER.id,
          token: DEVELOPER.token,
          homepage: 'http://example.com/second'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          secondOffer = response.offerID
          done()
        })
      },
      function retractFirstOffer (done) {
        apiRequest(port, {
          action: 'retract',
          developerID: DEVELOPER.id,
          token: DEVELOPER.token,
          offerID: firstOffer
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          done()
        })
      },
      function listDeveloperOffers (done) {
        apiRequest(port, {
          action: 'developer',
          developerID: DEVELOPER.id
        }, function (error, response) {
          if (error) return done(error)
          var offers = response.offers
          test.equal(
            offers.length, 2,
            'two offers'
          )
          test.notEqual(
            offers
              .find(function (element) {
                return element.offerID === firstOffer
              })
              .retracted,
            null,
            'first offer retracted'
          )
          test.equal(
            offers
              .find(function (element) {
                return element.offerID === secondOffer
              })
              .retracted,
            null,
            'second offer not retracted'
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
