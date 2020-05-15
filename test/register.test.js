var apiRequest = require('./api-request')
var email = require('../email')
var http = require('http')
var querystring = require('querystring')
var runWaterfall = require('run-waterfall')
var server = require('./server')
var tape = require('tape')

tape('register w/ invalid body', function (test) {
  server(function (port, close) {
    apiRequest(port, {
      action: 'register'
    }, function (error, response) {
      if (error) {
        test.ifError(error)
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
  server(function (port, close) {
    var address = 'text@example.com'
    apiRequest(port, {
      action: 'register',
      email: address,
      name: 'Test Developer',
      jurisdiction: 'US-CA',
      terms: (
        'I agree to the terms of service at ' +
        'https://licensezero.com/terms/service.'
      )
    }, function (error, response) {
      test.ifError(error)
      test.equal(response.error, false, 'no error')
      test.end()
      close()
    })
    email.events
      .once('message', function (message) {
        test.equal(message.to, address, 'e-mails registrant')
        test.assert(
          message.text.split('\n').some(function (line) {
            return line.includes('<https://connect.stripe.com')
          }),
          'link to connect'
        )
      })
  })
})

tape.skip('confirmation w/ bad stripe code', function (test) {
  server(function (port, close) {
    var address = 'text@example.com'
    runWaterfall([
      function (done) {
        var re = /https:\/\/connect.stripe.com\/oauth\/authorize\?(.+)/
        email.events.once('message', function (message) {
          done(null, re.exec(message.text)[1])
        })
        apiRequest(port, {
          action: 'register',
          email: address,
          name: 'Test Developer',
          jurisdiction: 'US-CA',
          terms: (
            'I agree to the terms of service at ' +
            'https://licensezero.com/terms/service.'
          )
        }, function (error, response) {
          if (error) {
            test.ifError(error)
          } else {
            test.equal(response.error, false, 'error false')
          }
        })
      },
      function (query, done) {
        var parsed = querystring.parse(query)
        http.request({
          port,
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
      test.ifError(error, 'no error')
      test.end()
      close()
    })
  })
})
