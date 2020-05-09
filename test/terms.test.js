var http = require('http')
var server = require('./server')
var simpleConcat = require('simple-concat')
var tape = require('tape')

tape('GET /terms', function (test) {
  server(function (port, close) {
    http.request({ port, path: '/terms' })
      .once('error', function (error) {
        test.ifError(error, 'no error')
        finish()
      })
      .once('response', function (response) {
        test.equal(response.statusCode, 200, '200')
        simpleConcat(response, function (error, body) {
          test.ifError(error, 'no body error')
          body = body.toString()
          test.assert(
            body.includes('service'),
            'includes "service"'
          )
          test.assert(
            body.includes('privacy'),
            'includes "privacy"'
          )
          test.assert(
            body.includes('agency'),
            'includes "agency"'
          )
          finish()
        })
      })
      .end()
    function finish () {
      test.end()
      close()
    }
  })
})
