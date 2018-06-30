var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var uuid = require('uuid/v4')
var writeTestLicensor = require('./write-test-licensor')

tape('project', function (test) {
  server(function (port, service, close) {
    var projectID
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          projectID = response.projectID
          done()
        })
      },
      function requestProject (done) {
        apiRequest(port, {
          action: 'project',
          projectID: projectID
        }, function (error, response) {
          if (error) return done(error)
          test.assert(
            !response.hasOwnProperty('stripe'),
            'no Stripe data'
          )
          test.deepEqual(
            response, {
              projectID: projectID,
              homepage: OFFER.homepage,
              pricing: OFFER.pricing,
              licensor: {
                licensorID: LICENSOR.id,
                name: LICENSOR.name,
                jurisdiction: LICENSOR.jurisdiction,
                publicKey: LICENSOR.publicKey
              },
              description: OFFER.description,
              commission: service.commission,
              error: false
            },
            'response'
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

tape('nonexistent project', function (test) {
  server(function (port, service, close) {
    apiRequest(port, {
      action: 'project',
      projectID: uuid()
    }, function (error, response) {
      if (error) {
        test.error(error)
      } else {
        test.equal(response.error, 'no such project')
      }
      test.end()
      close()
    })
  })
})

tape('/project/{id}', function (test) {
  server(function (port, service, close) {
    var projectID
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          projectID = response.projectID
          done()
        })
      },
      function browse (done) {
        require('./webdriver')
          .url('http://localhost:' + port + '/projects/' + projectID)
          .waitForExist('h2')
          .getText('.projectID')
          .then(function (text) {
            test.equal(
              text, projectID,
              'project ID'
            )
            done()
          })
          .catch(done)
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})
