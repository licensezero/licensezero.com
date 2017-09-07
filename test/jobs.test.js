var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var fs = require('fs')
var http = require('http')
var mutateJSONFile = require('../data/mutate-json-file')
var ordersPath = require('../paths/orders')
var path = require('path')
var resetTokensPath = require('../paths/reset-tokens')
var runSeries = require('run-series')
var server = require('./server')
var sweepOrders = require('../jobs/delete-expired-orders')
var sweepResetTokens = require('../jobs/delete-expired-reset-tokens')
var tape = require('tape')
var writeTestLicensor = require('./write-test-licensor')

tape('sweep orders', function (test) {
  server(function (port, service, close) {
    var projectID
    var location
    runSeries([
      writeTestLicensor.bind(null, service),
      function offerFirst (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          projectID = response.project
          done()
        })
      },
      function order (done) {
        apiRequest(port, {
          action: 'order',
          projects: [projectID],
          licensee: 'SomeCo, Inc.',
          jurisdiction: 'US-CA',
          tier: 'team'
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
        var directory = ordersPath(service)
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
        sweepOrders(service, done)
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
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('sweep reset tokens', function (test) {
  server(function (port, service, close) {
    var resetToken
    service.email.events.once('message', function (message) {
      test.equal(message.to, LICENSOR.email, 'email to licensor')
      message.text.forEach(function (paragraph) {
        var match = /https:\/\/licensezero.com\/reset\/([0-9a-f]{64})/
          .exec(paragraph)
        if (match) resetToken = match[1]
      })
    })
    writeTestLicensor(service, function (error) {
      test.error(error, 'no error')
      runSeries([
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
        function backdateResetToken (done) {
          var directory = resetTokensPath(service)
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
          sweepResetTokens(service, done)
        },
        function visitResetPage (done) {
          http.request({
            port: port,
            path: '/reset/' + resetToken
          })
            .once('error', done)
            .once('response', function (response) {
              test.equal(response.statusCode, 404, '404')
              done()
            })
            .end()
        }
      ], function (error) {
        test.error(error, 'error')
        test.end()
        close()
      })
    })
  })
})
