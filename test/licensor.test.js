var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestLicensor = require('./write-test-licensor')

tape('licensor', function (test) {
  server(function (port, close) {
    writeTestLicensor(function (error) {
      test.error(error)
      apiRequest(port, {
        action: 'licensor',
        licensorID: LICENSOR.id
      }, function (error, response) {
        if (error) {
          test.error(error)
        } else {
          test.equal(
            response.error, false,
            'error false'
          )
          test.equal(
            response.name, LICENSOR.name,
            'name'
          )
          test.equal(
            response.jurisdiction, LICENSOR.jurisdiction,
            'jurisdiction'
          )
          test.assert(
            /^[0-9a-f]{64}$/.test(response.publicKey),
            'publicKey'
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

tape('licensor w/ invalid id', function (test) {
  server(function (port, close) {
    apiRequest(port, {
      action: 'licensor',
      licensorID: LICENSOR.id
    }, function (error, response) {
      if (error) {
        test.error(error)
      } else {
        test.equal(
          response.error, 'no such licensor',
          'no such licensor'
        )
      }
      test.end()
      close()
    })
  })
})

tape('licensor w/ offer', function (test) {
  server(function (port, close) {
    var offerID
    runSeries([
      writeTestLicensor.bind(null),
      function offerOffer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token
        }), function (error, response) {
          if (error) return done(error)
          offerID = response.offerID
          done()
        })
      },
      function (done) {
        apiRequest(port, {
          action: 'licensor',
          licensorID: LICENSOR.id
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.offers.length, 1,
            'one offer'
          )
          test.equal(
            response.offers[0].offerID, offerID,
            'offered offer'
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

tape('licensor w/ retracted offer', function (test) {
  server(function (port, close) {
    var offerID
    runSeries([
      writeTestLicensor.bind(null),
      function offerOffer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token
        }), function (error, response) {
          if (error) return done(error)
          offerID = response.offerID
          done()
        })
      },
      function retractOffer (done) {
        apiRequest(port, {
          action: 'retract',
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          offerID
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          done()
        })
      },
      function listLicensorOffers (done) {
        apiRequest(port, {
          action: 'licensor',
          licensorID: LICENSOR.id
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
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('licensor w/ retracted offer', function (test) {
  server(function (port, close) {
    var firstOffer
    var secondOffer
    runSeries([
      writeTestLicensor.bind(null),
      function offerFirstOffer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
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
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
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
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          offerID: firstOffer
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          done()
        })
      },
      function listLicensorOffers (done) {
        apiRequest(port, {
          action: 'licensor',
          licensorID: LICENSOR.id
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
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})
