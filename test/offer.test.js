var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var UUIDV4 = require('../data/uuidv4-pattern')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var server = require('./server')
var tape = require('tape')
var writeTestLicensor = require('./write-test-licensor')

tape('offer', function (test) {
  server(function (port, service, close) {
    writeTestLicensor(service, function (error) {
      test.error(error)
      apiRequest(port, Object.assign(clone(OFFER), {
        licensorID: LICENSOR.id,
        token: LICENSOR.token
      }), function (error, response) {
        test.error(error)
        test.equal(
          response.error, false,
          'error false'
        )
        test.assert(
          response.hasOwnProperty('project'),
          'project'
        )
        test.assert(
          new RegExp(UUIDV4).test(response.project),
          'UUIDv4'
        )
        test.end()
        close()
      })
    })
  })
})
