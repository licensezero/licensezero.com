var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var uuid = require('uuid').v4
var writeTestLicensor = require('./write-test-licensor')

tape('quote', function (test) {
  server(function (port, close) {
    var firstProject
    var secondProject
    runSeries([
      writeTestLicensor.bind(null),
      function offerFirst (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          homepage: 'http://example.com/first'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          firstProject = response.projectID
          done()
        })
      },
      function offerSecond (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          homepage: 'http://example.com/second'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          secondProject = response.projectID
          done()
        })
      },
      function quote (done) {
        apiRequest(port, {
          action: 'quote',
          projects: [firstProject, secondProject]
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          test.deepEqual(
            response.projects,
            [
              {
                projectID: firstProject,
                description: OFFER.description,
                pricing: OFFER.pricing,
                homepage: 'http://example.com/first',
                licensor: {
                  licensorID: LICENSOR.id,
                  name: 'Test User',
                  jurisdiction: 'US-CA',
                  publicKey: LICENSOR.publicKey
                },
                commission: parseInt(process.env.COMMISSION)
              },
              {
                projectID: secondProject,
                description: OFFER.description,
                pricing: OFFER.pricing,
                homepage: 'http://example.com/second',
                licensor: {
                  licensorID: LICENSOR.id,
                  name: 'Test User',
                  jurisdiction: 'US-CA',
                  publicKey: LICENSOR.publicKey
                },
                commission: parseInt(process.env.COMMISSION)
              }
            ],
            'quotes terms'
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

tape('quote w/ nonexistent', function (test) {
  server(function (port, close) {
    var projectID = uuid()
    apiRequest(port, {
      action: 'quote',
      projects: [projectID]
    }, function (error, response) {
      test.ifError(error)
      test.equal(
        response.error, 'no such project: ' + projectID,
        'no such project'
      )
      test.end()
      close()
    })
  })
})

tape('quote w/ retracted', function (test) {
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
      function retract (done) {
        apiRequest(port, {
          action: 'retract',
          projectID,
          licensorID: LICENSOR.id,
          token: LICENSOR.token
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'retract error false')
          done()
        })
      },
      function quote (done) {
        apiRequest(port, {
          action: 'quote',
          projects: [projectID]
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.projects[0].projectID, projectID,
            'project'
          )
          test.equal(
            response.projects[0].retracted, true,
            'retracted'
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
