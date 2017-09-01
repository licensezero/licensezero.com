var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var ed25519 = require('../ed25519')
var runSeries = require('run-series')
var server = require('./server')
var stringify = require('json-stable-stringify')
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
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          product = response.product
          done()
        })
      },
      function publicLicense (done) {
        apiRequest(port, {
          action: 'public',
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          productID: product
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error, false,
            'error false'
          )
          test.assert(
            response.hasOwnProperty('license'),
            'document'
          )
          var license = response.license
          test.assert(
            license.hasOwnProperty('document'),
            'license.document'
          )
          test.assert(
            license.hasOwnProperty('licensorSignature'),
            'license.licensorSignature'
          )
          test.assert(
            /^[0-9a-f]{128}$/.test(license.licensorSignature),
            'licensor ed25519 signature'
          )
          test.assert(
            license.hasOwnProperty('agentSignature'),
            'license.agentSignature'
          )
          test.assert(
            /^[0-9a-f]{128}$/.test(license.agentSignature),
            'agent ed25519 signature'
          )
          test.assert(
            response.hasOwnProperty('metadata'),
            'metadata'
          )
          var metadata = response.metadata
          test.assert(
            metadata.hasOwnProperty('licensezero'),
            'licensezero'
          )
          var licensezero = metadata.licensezero
          test.assert(
            licensezero.hasOwnProperty('licensorSignature'),
            'licensezero.licensorSignature'
          )
          test.assert(
            licensezero.hasOwnProperty('agentSignature'),
            'licensezero.agentSignature'
          )
          test.equal(
            metadata.license, 'SEE LICENSE IN LICENSE',
            'metadata.license'
          )
          apiRequest(port, {
            action: 'key'
          }, function (error, response) {
            if (error) return done(error)
            var agentPublicKey = response.key
            // Validate license signatures.
            test.assert(
              ed25519.verify(
                license.document,
                license.licensorSignature,
                LICENSOR.publicKey
              ),
              'valid document licensor signature'
            )
            test.assert(
              ed25519.verify(
                license.document +
                '---\nLicensor:\n' +
                [
                  license.licensorSignature.slice(0, 32),
                  license.licensorSignature.slice(32, 64),
                  license.licensorSignature.slice(64, 96),
                  license.licensorSignature.slice(96)
                ].join('\n') + '\n',
                license.agentSignature,
                agentPublicKey
              ),
              'valid document agent signature'
            )
            // Validate metadata signatures.
            test.assert(
              ed25519.verify(
                stringify(licensezero.license),
                licensezero.licensorSignature,
                LICENSOR.publicKey
              ),
              'valid metadata licensor signature'
            )
            test.assert(
              ed25519.verify(
                stringify({
                  license: licensezero.license,
                  licensorSignature: licensezero.licensorSignature
                }),
                licensezero.agentSignature,
                agentPublicKey
              ),
              'valid metadata agent signature'
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

tape('public for nonexistent product', function (test) {
  server(function (port, service, close) {
    runSeries([
      writeTestLicensor.bind(null, service),
      function (done) {
        apiRequest(port, {
          action: 'public',
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          productID: uuid()
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error, 'no such product',
            'no such product'
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

tape('public for retracted product', function (test) {
  server(function (port, service, close) {
    var product
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'offer: error false')
          product = response.product
          done()
        })
      },
      function retract (done) {
        apiRequest(port, {
          action: 'retract',
          productID: product,
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'retract: error false')
          done()
        })
      },
      function (done) {
        apiRequest(port, {
          action: 'public',
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          productID: product
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error, 'retracted product',
            'retracted product'
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
