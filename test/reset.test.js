var LICENSOR = require('./licensor')
var apiRequest = require('./api-request')
var server = require('./server')
var tape = require('tape')
var writeTestLicensor = require('./write-test-licensor')

tape('reset', function (test) {
  server(function (port, service, close) {
    service.email.events.once('message', function (message) {
      test.equal(message.to, LICENSOR.email, 'email to licensor')
      test.assert(message.text.some(function (paragraph) {
        return paragraph.includes('https://licensezero.com/reset/')
      }), 'reset link')
      test.end()
      close()
    })
    writeTestLicensor(service, function (error) {
      test.error(error, 'no error')
      apiRequest(port, {
        action: 'reset',
        licensorID: LICENSOR.id,
        email: LICENSOR.email
      }, function (error, response) {
        test.error(error, 'no error')
        test.equal(response.error, false, 'error false')
      })
    })
  })
})

tape('reset w/ bad email', function (test) {
  server(function (port, service, close) {
    writeTestLicensor(service, function (error) {
      test.error(error, 'no error')
      apiRequest(port, {
        action: 'reset',
        licensorID: LICENSOR.id,
        email: 'wrong@example.com'
      }, function (error, response) {
        test.error(error, 'no error')
        test.equal(response.error, 'invalid body', 'invalid')
        test.end()
        close()
      })
    })
  })
})
