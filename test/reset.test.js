var LICENSOR = require('./licensor')
var apiRequest = require('./api-request')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestLicensor = require('./write-test-licensor')

tape('reset action', function (test) {
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

tape('reset link', function (test) {
  server(function (port, service, close) {
    var resetToken
    var newToken
    service.email.events.once('message', function (message) {
      test.equal(message.to, LICENSOR.email, 'email to licensor')
      message.text.forEach(function (paragraph) {
        var match = /https:\/\/licensezero.com\/reset\/([0-9a-f]{64})/
          .exec(paragraph)
        if (match) resetToken = match[1]
      })
    })
    runSeries([
      writeTestLicensor.bind(null, service),
      function resetAction (done) {
        apiRequest(port, {
          action: 'reset',
          licensorID: LICENSOR.id,
          email: LICENSOR.email
        }, function (error, response) {
          test.error(error, 'no error')
          test.equal(response.error, false, 'error false')
          done()
        })
      },
      function visitResetPage (done) {
        require('./webdriver')
          .url('http://localhost:' + port + '/reset/' + resetToken)
          .waitForExist('h1')
          .getText('code.token')
          .then(function (text) {
            newToken = text
            done()
          })
          .catch(done)
      },
      function useNewToken (done) {
        apiRequest(port, {
          action: 'jurisdiction',
          licensorID: LICENSOR.id,
          password: newToken,
          jurisdiction: 'US-TX'
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'no error')
          done()
        })
      }
    ], function (error) {
      test.error(error, 'error')
      test.end()
      close()
    })
  })
})
