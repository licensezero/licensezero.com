var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var ed25519 = require('../util/ed25519')
var has = require('has')
var runSeries = require('run-series')
var server = require('./server')
var stringify = require('json-stable-stringify')
var tape = require('tape')
var uuid = require('uuid/v4')
var writeTestLicensor = require('./write-test-licensor')

tape('public prosperity', function (test) {
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
      function publicLicense (done) {
        apiRequest(port, {
          action: 'public',
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          offerID,
          terms: 'prosperity'
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error, false,
            'error false'
          )
          test.assert(
            has(response, 'license'),
            'document'
          )
          var license = response.license
          test.assert(
            has(license, 'document'),
            'license.document'
          )
          test.assert(
            has(license, 'licensorSignature'),
            'license.licensorSignature'
          )
          test.assert(
            /^[0-9a-f]{128}$/.test(license.licensorSignature),
            'licensor ed25519 signature'
          )
          test.assert(
            has(license, 'agentSignature'),
            'license.agentSignature'
          )
          test.assert(
            /^[0-9a-f]{128}$/.test(license.agentSignature),
            'agent ed25519 signature'
          )
          test.assert(
            has(response, 'metadata'),
            'metadata'
          )
          var metadata = response.metadata
          test.assert(
            has(metadata, 'licensezero'),
            'licensezero'
          )
          var licensezero = metadata.licensezero
          test.assert(
            has(licensezero, 'licensorSignature'),
            'licensezero.licensorSignature'
          )
          test.assert(
            has(licensezero, 'agentSignature'),
            'licensezero.agentSignature'
          )
          test.assert(
            has(licensezero, 'license'),
            'licensezero.license'
          )
          test.assert(
            has(licensezero.license, 'terms'),
            'licensezero.license.terms'
          )
          test.equal(
            licensezero.license.terms, 'prosperity',
            'prosperity terms'
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

tape('public parity', function (test) {
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
      function publicLicense (done) {
        apiRequest(port, {
          action: 'public',
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          offerID,
          terms: 'parity'
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error, false,
            'error false'
          )
          test.assert(
            has(response, 'license'),
            'document'
          )
          var license = response.license
          test.assert(
            has(license, 'document'),
            'license.document'
          )
          test.assert(
            has(license, 'licensorSignature'),
            'license.licensorSignature'
          )
          test.assert(
            /^[0-9a-f]{128}$/.test(license.licensorSignature),
            'licensor ed25519 signature'
          )
          test.assert(
            has(license, 'agentSignature'),
            'license.agentSignature'
          )
          test.assert(
            /^[0-9a-f]{128}$/.test(license.agentSignature),
            'agent ed25519 signature'
          )
          test.assert(
            has(response, 'metadata'),
            'metadata'
          )
          var metadata = response.metadata
          test.assert(
            has(metadata, 'licensezero'),
            'licensezero'
          )
          var licensezero = metadata.licensezero
          test.assert(
            has(licensezero, 'licensorSignature'),
            'licensezero.licensorSignature'
          )
          test.assert(
            has(licensezero, 'agentSignature'),
            'licensezero.agentSignature'
          )
          test.assert(
            has(licensezero, 'license'),
            'licensezero.license'
          )
          test.assert(
            has(licensezero.license, 'terms'),
            'licensezero.license.terms'
          )
          test.equal(
            licensezero.license.terms, 'parity',
            'parity terms'
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

tape('public for nonexistent project', function (test) {
  server(function (port, close) {
    runSeries([
      writeTestLicensor.bind(null),
      function (done) {
        apiRequest(port, {
          action: 'public',
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          offerID: uuid(),
          terms: 'prosperity'
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error, 'no such project',
            'no such project'
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

tape('public for retracted project', function (test) {
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
      function (done) {
        apiRequest(port, {
          action: 'public',
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          offerID,
          terms: 'prosperity'
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error, 'retracted project',
            'retracted project'
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

tape('public charity', function (test) {
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
      function publicLicense (done) {
        apiRequest(port, {
          action: 'public',
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          offerID,
          terms: 'charity'
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error, false,
            'error false'
          )
          test.assert(
            has(response, 'license'),
            'document'
          )
          var license = response.license
          test.assert(
            has(license, 'document'),
            'license.document'
          )
          test.assert(
            has(license, 'licensorSignature'),
            'license.licensorSignature'
          )
          test.assert(
            /^[0-9a-f]{128}$/.test(license.licensorSignature),
            'licensor ed25519 signature'
          )
          test.assert(
            has(license, 'agentSignature'),
            'license.agentSignature'
          )
          test.assert(
            /^[0-9a-f]{128}$/.test(license.agentSignature),
            'agent ed25519 signature'
          )
          test.assert(
            has(response, 'metadata'),
            'metadata'
          )
          var metadata = response.metadata
          test.assert(
            !has(metadata, 'licensezero'),
            'no licensezero'
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
