var developer = require('./developer')
var OFFER = require('./offer')
var PERSON = 'I am a person, not a legal entity.'
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var email = require('../email')
var fs = require('fs')
var http = require('http')
var mutateJSONFile = require('../data/mutate-json-file')
var ordersPath = require('../paths/orders')
var path = require('path')
var pino = require('pino')
var resetTokensPath = require('../paths/reset-tokens')
var runSeries = require('run-series')
var server = require('./server')
var sweepOrders = require('../jobs/delete-expired-orders')
var sweepResetTokens = require('../jobs/delete-expired-reset-tokens')
var tape = require('tape')
var writeTestDeveloper = require('./write-test-developer')

tape.skip('sweep orders', function (test) {
  server(function (port, close) {
    var offerID
    var location
    runSeries([
      writeTestDeveloper.bind(null),
      function offerFirst (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          developerID: developer.id,
          token: developer.token
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          offerID = response.offerID
          done()
        })
      },
      function order (done) {
        // TODO: Replace this API call with a form submission.
        apiRequest(port, {
          action: 'order',
          offers: [offerID],
          licensee: 'Larry Licensee',
          jurisdiction: 'US-CA',
          email: 'licensee@test.com',
          person: PERSON
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'order error false')
          test.assert(
            response.location.indexOf('/pay/') === 0,
            'location'
          )
          location = response.location
          done()
        })
      },
      function backdateOrder (done) {
        var directory = ordersPath()
        fs.readdir(directory, function (error, entries) {
          if (error) return done(error)
          var file = path.join(directory, entries[0])
          mutateJSONFile(file, function (data) {
            var yesteryear = new Date()
            yesteryear.setFullYear(yesteryear.getFullYear() - 1)
            data.date = yesteryear
          }, done)
        })
      },
      function tryToPayAfterBackdating (done) {
        http.get(
          'http://localhost:' + port + location,
          function (response) {
            test.equal(response.statusCode, 404)
            done()
          }
        )
      },
      function sweep (done) {
        var log = pino({}, fs.createWriteStream('/dev/null'))
        sweepOrders(log, done)
      },
      function tryToPayAfterSweep (done) {
        http.get(
          'http://localhost:' + port + location,
          function (response) {
            test.equal(response.statusCode, 404)
            done()
          }
        )
      }
    ], function (error) {
      test.ifError(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('sweep reset tokens', function (test) {
  server(function (port, close) {
    var resetToken
    email.events.once('message', function (message) {
      test.equal(message.to, developer.email, 'email to developer')
      message.text.split('\n').forEach(function (paragraph) {
        var match = /https:\/\/licensezero.com\/reset\/([0-9a-f]{64})/
          .exec(paragraph)
        if (match) resetToken = match[1]
      })
    })
    writeTestDeveloper(function (error) {
      test.ifError(error, 'no error')
      runSeries([
        function resetAction (done) {
          apiRequest(port, {
            action: 'reset',
            developerID: developer.id,
            email: developer.email
          }, function (error, response) {
            test.ifError(error, 'no error')
            test.equal(response.error, false, 'error false')
            done()
          })
        },
        function backdateResetToken (done) {
          var directory = resetTokensPath()
          fs.readdir(directory, function (error, entries) {
            if (error) return done(error)
            var file = path.join(directory, entries[0])
            mutateJSONFile(file, function (data) {
              var yesteryear = new Date()
              yesteryear.setFullYear(yesteryear.getFullYear() - 1)
              data.date = yesteryear
            }, done)
          })
        },
        function sweep (done) {
          var log = pino({}, fs.createWriteStream('/dev/null'))
          sweepResetTokens(log, done)
        },
        function visitResetPage (done) {
          http.request({ port, path: '/reset/' + resetToken })
            .once('error', done)
            .once('response', function (response) {
              test.equal(response.statusCode, 404, '404')
              done()
            })
            .end()
        }
      ], function (error) {
        test.ifError(error, 'error')
        test.end()
        close()
      })
    })
  })
})
