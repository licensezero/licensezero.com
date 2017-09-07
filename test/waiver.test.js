var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var ed25519 = require('../ed25519')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var uuid = require('uuid/v4')
var writeTestLicensor = require('./write-test-licensor')

tape('waiver', function (test) {
  server(function (port, service, close) {
    var project
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          project = response.project
          done()
        })
      },
      function issueWaiver (done) {
        apiRequest(port, {
          action: 'waiver',
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          projectID: project,
          beneficiary: 'SomeCo, Inc.',
          jurisdiction: 'US-CA',
          term: 365
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error, false,
            'error false'
          )
          test.assert(
            response.hasOwnProperty('manifest'),
            'manifest'
          )
          var manifest = response.manifest
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
          }, function (error, response) {
            if (error) return done(error)
            var publicKey = response.publicKey
            // TODO Publish license verification code as open source
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

tape('waiver for nonexistent project', function (test) {
  server(function (port, service, close) {
    runSeries([
      writeTestLicensor.bind(null, service),
      function issueWaiver (done) {
        apiRequest(port, {
          action: 'waiver',
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          projectID: uuid(),
          beneficiary: 'SomeCo, Inc.',
          jurisdiction: 'US-CA',
          term: 365
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

tape('waiver for retracted project', function (test) {
  server(function (port, service, close) {
    var project
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'offer: error false')
          project = response.project
          done()
        })
      },
      function retract (done) {
        apiRequest(port, {
          action: 'retract',
          projectID: project,
          licensorID: LICENSOR.id,
          password: LICENSOR.password
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
          password: LICENSOR.password,
          projectID: project,
          beneficiary: 'SomeCo, Inc.',
          jurisdiction: 'US-CA',
          term: 365
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
