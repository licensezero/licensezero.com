var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestLicensor = require('./write-test-licensor')

tape('sponsor', function (test) {
  server(function (port, close) {
    var projectID
    runSeries([
      writeTestLicensor.bind(null),
      function createProject (done) {
        var request = clone(OFFER)
        request.pricing.relicense = 10000
        apiRequest(port, Object.assign(request, {
          licensorID: LICENSOR.id,
          token: LICENSOR.token
        }), function (error, response) {
          if (error) return done(error)
          projectID = response.projectID
          done()
        })
      },
      function sponsorProject (done) {
        apiRequest(port, {
          action: 'sponsor',
          projectID,
          sponsor: 'Larry Licensee',
          jurisdiction: 'US-CA',
          email: 'licensee@example.com'
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'sponsor error false')
          test.assert(response.location.includes('/pay/'), 'location')
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
