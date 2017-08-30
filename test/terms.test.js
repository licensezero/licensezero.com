var http = require('http')
var server = require('./server')
var tape = require('tape')

tape('GET /terms', function (test) {
  server(function (port, configuration, close) {
    http.request({port: port, path: '/terms'})
      .once('response', function (response) {
        test.equal(response.statusCode, 200)
        test.equal(response.headers['content-type'], 'text/html')
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
