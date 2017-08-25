var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var ecb = require('ecb')
var ed25519 = require('ed25519')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var uuid = require('uuid/v4')
var writeTestLicensor = require('./write-test-licensor')

tape('public', function (test) {
  server(function (port, service, close) {
    var product
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensor: LICENSOR.id,
          password: LICENSOR.password
        }), ecb(done, function (response) {
          test.equal(response.error, false, 'error false')
          product = response.product
          done()
        }))
      },
      function publicLicense (done) {
        apiRequest(port, {
          action: 'public',
          licensor: LICENSOR.id,
          password: LICENSOR.password,
          product: product
        }, ecb(done, function (response) {
          test.equal(
            response.error, false,
            'error false'
          )
          test.assert(
            response.hasOwnProperty('document'),
            'document'
          )
          var document = response.document
          test.assert(
            response.hasOwnProperty('signature'),
            'signature'
          )
          var signature = response.signature
          test.assert(
            /^[0-9a-f]{128}$/.test(signature),
            'ed25519 signature'
          )
          apiRequest(port, {
            action: 'key'
          }, ecb(done, function (response) {
            var key = response.key
            test.assert(
              ed25519.Verify(
                Buffer.from(document, 'ascii'),
                Buffer.from(signature, 'hex'),
                Buffer.from(key, 'hex')
              ),
              'verifiable agent signature'
            )
            done()
          }))
        }))
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('public for nonexistent product', function (test) {
  server(function (port, service, close) {
    runSeries([
      writeTestLicensor.bind(null, service),
      function (done) {
        apiRequest(port, {
          action: 'public',
          licensor: LICENSOR.id,
          password: LICENSOR.password,
          product: uuid()
        }, ecb(done, function (response) {
          test.equal(
            response.error, 'no such product',
            'no such product'
          )
          done()
        }))
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('public for retracted product', function (test) {
  server(function (port, service, close) {
    var product
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensor: LICENSOR.id,
          password: LICENSOR.password
        }), ecb(done, function (response) {
          test.equal(response.error, false, 'offer: error false')
          product = response.product
          done()
        }))
      },
      function retract (done) {
        apiRequest(port, {
          action: 'retract',
          product: product,
          licensor: LICENSOR.id,
          password: LICENSOR.password
        }, ecb(done, function (response) {
          test.equal(response.error, false, 'retract: error false')
          done()
        }))
      },
      function (done) {
        apiRequest(port, {
          action: 'public',
          licensor: LICENSOR.id,
          password: LICENSOR.password,
          product: product
        }, ecb(done, function (response) {
          test.equal(
            response.error, 'retracted product',
            'retracted product'
          )
          done()
        }))
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})
