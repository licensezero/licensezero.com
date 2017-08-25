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

tape('waiver', function (test) {
  server(function (port, service, close) {
    var product
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }), ecb(done, function (response) {
          test.equal(response.error, false, 'error false')
          product = response.product
          done()
        }))
      },
      function issueWaiver (done) {
        apiRequest(port, {
          action: 'waiver',
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          productID: product,
          beneficiary: 'SomeCo, Inc.',
          term: 365
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
            action: 'licensor',
            licensorID: LICENSOR.id
          }, ecb(done, function (response) {
            var publicKey = response.publicKey
            test.assert(
              ed25519.Verify(
                Buffer.from(document, 'ascii'),
                Buffer.from(signature, 'hex'),
                Buffer.from(publicKey, 'hex')
              ),
              'verifiable signature'
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

tape('waiver for nonexistent product', function (test) {
  server(function (port, service, close) {
    runSeries([
      writeTestLicensor.bind(null, service),
      function issueWaiver (done) {
        apiRequest(port, {
          action: 'waiver',
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          productID: uuid(),
          beneficiary: 'SomeCo, Inc.',
          term: 365
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

tape('waiver for retracted product', function (test) {
  server(function (port, service, close) {
    var product
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
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
          productID: product,
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }, ecb(done, function (response) {
          test.equal(response.error, false, 'retract: error false')
          done()
        }))
      },
      function issueWaiver (done) {
        apiRequest(port, {
          action: 'waiver',
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          productID: product,
          beneficiary: 'SomeCo, Inc.',
          term: 365
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
