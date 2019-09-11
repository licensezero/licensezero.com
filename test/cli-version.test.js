var http = require('http')
var server = require('./server')
var simpleConcat = require('simple-concat')
var tape = require('tape')

tape('GET /cli-version', function (test) {
  server(function (port, close) {
    http.request({ port, path: '/cli-version' })
      .once('error', function (error) {
        test.error(error, 'no error')
        finish()
      })
      .once('response', function (response) {
        test.equal(response.statusCode, 200, '200')
        test.equal(
          response.headers['content-type'], 'text/plain',
          'text/plain'
        )
        simpleConcat(response, function (error, body) {
          body = body.toString()
          test.error(error, 'no body error')
          test.assert(
            /^v[0-9]+\.[0-9]+\.[0-9]+$/.test(body.toString()),
            'version string'
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
