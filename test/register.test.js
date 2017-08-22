var apiRequest = require('./api-request')
var http = require('http')
var parse = require('json-parse-errback')
var querystring = require('querystring')
var runSeries = require('run-series')
var runWaterfall = require('run-waterfall')
var server = require('./server')
var simpleConcat = require('simple-concat')
var tape = require('tape')

tape('register w/ invalid body', function (test) {
  server(function (port, configuration, close) {
    apiRequest(port, {
      action: 'register'
    }, function (error, response) {
      if (error) {
        test.error(error)
      } else {
        test.equal(
          response.error, 'invalid body',
          'error'
        )
      }
      test.end()
      close()
    })
  })
})

tape('register w/ valid body', function (test) {
  server(function (port, service, close) {
    var email = 'text@example.com'
    apiRequest(port, {
      action: 'register',
      email: email,
      name: 'Test Licensor',
      jurisdiction: 'US-CA'
    }, function (error, response) {
      if (error) {
        test.error(error)
      } else {
        test.equal(response.error, false, 'no error')
      }
    })
    service.email.events
      .once('message', function (message) {
        test.equal(message.to, email, 'e-mails registrant')
        test.assert(
          message.text.some(function (line) {
            return line.includes('https://connect.stripe.com')
          }),
          'link to connect'
        )
        test.end()
        close()
      })
  })
})

tape.only('registration confirmation w/ bad stripe code', function (test) {
  server(function (port, service, close) {
    var email = 'text@example.com'
    runWaterfall([
      function (done) {
        var re = /https:\/\/connect.stripe.com\/oauth\/authorize\?(.+)/
        service.email.events.once('message', function (message) {
          done(null, re.exec(message.text.join('\n\n'))[1])
        })
        apiRequest(port, {
          action: 'register',
          email: email,
          name: 'Test Licensor',
          jurisdiction: 'US-CA'
        }, function (error, response) {
          if (error) {
            test.error(error)
          } else {
            test.equal(response.error, false, 'error false')
          }
        })
      },
      function (query, done) {
        var parsed = querystring.parse(query)
        http.request({
          port: port,
          path: '/stripe-redirect?' + querystring.stringify({
            scope: 'read_write',
            code: 'invalid code',
            state: parsed.state
          })
        })
          .once('error', done)
          .once('response', function (response) {
            test.equal(response.statusCode, 400, '400')
            done()
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
