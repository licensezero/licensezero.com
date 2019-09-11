var http = require('http')
var server = require('./server')
var tape = require('tape')

tape('GET /manifesto', function (test) {
  server(function (port, close) {
    http.request({ port, path: '/manifesto' })
      .once('error', function (error) {
        test.error(error, 'no error')
        finish()
      })
      .once('response', function (response) {
        test.equal(response.statusCode, 301, '301')
        finish()
      })
      .end()
    function finish () {
      test.end()
      close()
    }
  })
})
