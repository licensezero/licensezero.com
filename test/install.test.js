var http = require('http')
var server = require('./server')
var tape = require('tape')

tape('GET /install.sh', function (test) {
  server(function (port, close) {
    http.request({ port: port, path: '/install.sh' })
      .once('error', function (error) {
        test.error(error, 'no error')
        finish()
      })
      .once('response', function (response) {
        test.equal(response.statusCode, 302, '302')
        finish()
      })
      .end()
    function finish () {
      test.end()
      close()
    }
  })
})
