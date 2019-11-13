var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var ed25519 = require('../util/ed25519')
var has = require('has')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var uuid = require('uuid/v4')
var writeTestLicensor = require('./write-test-licensor')

tape('waiver', function (test) {
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
      function issueWaiver (done) {
        apiRequest(port, {
          action: 'waiver',
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          offerID,
          beneficiary: 'Larry Licensee',
          jurisdiction: 'US-CA',
          term: 365
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error, false,
            'error false'
          )
          test.assert(
            has(response, 'offerID'),
            'offer ID'
          )
          test.assert(
            has(response, 'manifest'),
            'manifest'
          )
          var manifest = response.manifest
          test.assert(
            has(response, 'document'),
            'document'
          )
          var document = response.document
          test.assert(
            has(response, 'signature'),
            'signature'
          )
          var signature = response.signature
          test.assert(
            /^[0-9a-f]{128}$/.test(signature),
            'ed25519 signature'
          )
          test.assert(
            has(response, 'publicKey'),
            'public key'
          )
          var publicKey = response.publicKey
          test.assert(
            /^[0-9a-f]{64}$/.test(publicKey),
            'public key'
          )
          apiRequest(port, {
            action: 'licensor',
            licensorID: LICENSOR.id
          }, function (error, response) {
            if (error) return done(error)
            var publicKey = response.publicKey
            test.assert(
              ed25519.verify(
                manifest + '\n\n' + document,
                signature,
                publicKey
              ),
              'verifiable signature'
            )
            done()
          })
        })
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('waiver for nonexistent offer', function (test) {
  server(function (port, close) {
    runSeries([
      writeTestLicensor.bind(null),
      function issueWaiver (done) {
        apiRequest(port, {
          action: 'waiver',
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          offerID: uuid(),
          beneficiary: 'Larry Licensee',
          jurisdiction: 'US-CA',
          term: 365
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
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('waiver for retracted offer', function (test) {
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
          test.equal(response.error, false, 'offer: error false')
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
          test.equal(response.error, false, 'retract: error false')
          done()
        })
      },
      function issueWaiver (done) {
        apiRequest(port, {
          action: 'waiver',
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          offerID,
          beneficiary: 'Larry Licensee',
          jurisdiction: 'US-CA',
          term: 365
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error, 'retracted offer',
            'retracted offer'
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
