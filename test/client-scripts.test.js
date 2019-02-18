var http = require('http')
var server = require('./server')
var tape = require('tape')

tape('GET /pay.js', function (test) {
  server(function (port, close) {
    http.request({ port: port, path: '/pay.js' })
      .once('response', function (response) {
        test.equal(response.statusCode, 200)
        test.equal(
          response.headers['content-type'],
          'application/javascript'
        )
        finish()
      })
      .once('error', function (error) {
        test.fail(error, 'no error')
        finish()
      })
      .end()
    function finish () {
      test.end()
      close()
    }
  })
})
