var apiRequest = require('./api-request')
var email = require('../email')
var http = require('http')
var querystring = require('querystring')
var runWaterfall = require('run-waterfall')
var server = require('./server')
var simpleConcat = require('simple-concat')
var tape = require('tape')

tape('GET /stripe-redirect', function (test) {
  server(function (port, close) {
    http.request({ port, path: '/stripe-redirect' })
      .once('error', function (error) {
        test.ifError(error, 'no error')
        finish()
      })
      .once('response', function (response) {
        test.equal(response.statusCode, 400, '400')
        finish()
      })
      .end()
    function finish () {
      test.end()
      close()
    }
  })
})

tape('GET /stripe-redirect?error=&error_description=', function (test) {
  server(function (port, close) {
    http.request({
      port,
      path: '/stripe-redirect?' + querystring.stringify({
        error: 'bad',
        error_description: 'bad things'
      })
    })
      .once('error', function (error) {
        test.ifError(error, 'no error')
        finish()
      })
      .once('response', function (response) {
        test.equal(response.statusCode, 200, '200')
        finish()
      })
      .end()
    function finish () {
      test.end()
      close()
    }
  })
})

tape('GET /stripe-redirect w/ bad state', function (test) {
  server(function (port, close) {
    http.request({
      port,
      path: '/stripe-redirect?' + querystring.stringify({
        state: 'nonsense',
        code: 'nonsense',
        scope: 'read_write'
      })
    })
      .once('error', function (error) {
        test.ifError(error, 'no error')
        finish()
      })
      .once('response', function (response) {
        test.equal(response.statusCode, 400, '400')
        finish()
      })
      .end()
    function finish () {
      test.end()
      close()
    }
  })
})

tape('GET /stripe-redirect w/ test state', function (test) {
  server(function (port, close) {
    var address = 'text@example.com'
    runWaterfall([
      function (done) {
        var re = /<https:\/\/connect.stripe.com\/oauth\/authorize\?(.+)>/
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
            code: 'TEST_STRIPE_CODE',
            state: parsed.state
          })
        })
          .once('error', done)
          .once('response', function (response) {
            test.equal(response.statusCode, 200, '200')
            simpleConcat(response, function (error, buffer) {
              if (error) return done(error)
              var id = /<span class=id>([^<]+)<\/span>/
                .exec(buffer.toString())[1]
              var token = /<code class=token>([^<]+)<\/code>/
                .exec(buffer.toString())[1]
              done(null, id, token)
            })
          })
          .end()
      },
      function useCredentials (id, token, done) {
        apiRequest(port, {
          action: 'email',
          developerID: id,
          token,
          email: 'another@example.com'
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          done(null, id)
        })
      },
      function fetchDeveloper (id, done) {
        apiRequest(port, {
          action: 'developer',
          developerID: id
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          test.equal(response.name, 'Test Developer', 'name')
          done(null, id)
        })
      }
    ], function (error) {
      test.ifError(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('PUT /stripe-redirect', function (test) {
  server(function (port, close) {
    http.request({ method: 'PUT', port, path: '/stripe-redirect' })
      .once('error', function (error) {
        test.ifError(error, 'no error')
        finish()
      })
      .once('response', function (response) {
        test.equal(response.statusCode, 405, '405')
        finish()
      })
      .end()
    function finish () {
      test.end()
      close()
    }
  })
})
