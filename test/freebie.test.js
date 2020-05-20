var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var developer = require('./developer')
var ed25519 = require('../util/ed25519')
var has = require('has')
var runSeries = require('run-series')
var server = require('./server')
var stringify = require('json-stable-stringify')
var tape = require('tape')
var uuid = require('uuid').v4
var writeTestDeveloper = require('./write-test-developer')

tape('freebie', function (test) {
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
      function issueFreebie (done) {
        var user = {
          name: 'Larry Licensee',
          jurisdiction: 'US-CA',
          email: 'larry@example.com'
        }
        var term = 365
        apiRequest(port, {
          action: 'freebie',
          developerID: developer.id,
          token: developer.token,
          offerID,
          name: user.name,
          jurisdiction: user.jurisdiction,
          email: user.email,
          term
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
            has(response, 'metadata'),
            'metadata'
          )
          var manifest = stringify(response.metadata)
          test.assert(
            has(response, 'commonmark'),
            'commonmark'
          )
          var commonmark = response.commonmark
          var commonmarkStrings = {
            'developer name': developer.name,
            'developer jurisdiction': developer.jurisdiction,
            'user name': user.name,
            'user jurisdiction': user.jurisdiction,
            'user email': user.email,
            term: '' + term + ' days',
            price: '$2.00'
          }
          Object.keys(commonmarkStrings).forEach(function (key) {
            test.assert(
              commonmark.includes(commonmarkStrings[key]),
              key
            )
          })
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
            'hex public key'
          )
          apiRequest(port, {
            action: 'key'
          }, function (error, response) {
            if (error) return done(error)
            test.assert(
              ed25519.verify(
                manifest + '\n\n' + commonmark,
                signature,
                response.key
              ),
              'verifiable signature'
            )
            done()
          })
        })
      }
    ], function (error) {
      test.ifError(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('freebie for nonexistent offer', function (test) {
  server(function (port, close) {
    runSeries([
      writeTestDeveloper.bind(null),
      function issueFreebie (done) {
        apiRequest(port, {
          action: 'freebie',
          developerID: developer.id,
          token: developer.token,
          offerID: uuid(),
          name: 'Larry Licensee',
          email: 'larry@exmaple.com',
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
      test.ifError(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('freebie for retracted offer', function (test) {
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
          test.equal(response.error, false, 'offer: error false')
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
          test.equal(response.error, false, 'retract: error false')
          done()
        })
      },
      function issueFreebie (done) {
        apiRequest(port, {
          action: 'freebie',
          developerID: developer.id,
          token: developer.token,
          offerID,
          name: 'Larry Licensee',
          jurisdiction: 'US-CA',
          email: 'larry@exmaple.com',
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
      test.ifError(error, 'no error')
      test.end()
      close()
    })
  })
})
