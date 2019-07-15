var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var has = require('has')
var http = require('http')
var runSeries = require('run-series')
var server = require('./server')
var simpleConcat = require('simple-concat')
var tape = require('tape')
var uuid = require('uuid/v4')
var writeTestLicensor = require('./write-test-licensor')

tape('project', function (test) {
  server(function (port, close) {
    var projectID
    runSeries([
      writeTestLicensor.bind(null),
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
            !has(response, 'stripe'),
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
              commission: parseInt(process.env.COMMISSION),
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
  server(function (port, close) {
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
  server(function (port, close) {
    var projectID
    runSeries([
      writeTestLicensor.bind(null),
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
          .url('http://localhost:' + port + '/ids/' + projectID)
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

tape('/project/{id}/badge.svg', function (test) {
  server(function (port, close) {
    var projectID
    runSeries([
      writeTestLicensor.bind(null),
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
        http.request({
          port: port,
          path: 'http://localhost:' + port + '/ids/' + projectID + '/badge.svg'
        })
          .once('error', function (error) {
            done(error)
          })
          .once('response', function (response) {
            test.equal(response.statusCode, 200, '200')
            simpleConcat(response, function (error, body) {
              test.error(error, 'no body error')
              test.equal(
                response.headers['content-type'],
                'image/svg+xml',
                'SVG'
              )
              done()
            })
          })
          .end()
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})
