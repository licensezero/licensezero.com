var http = require('http')
var server = require('./server')
var simpleConcat = require('simple-concat')
var tape = require('tape')

tape('GET /robots.txt', function (test) {
  server(function (port, configuration, close) {
    http.request({port: port, path: '/robots.txt'})
      .once('response', function (response) {
        test.equal(response.statusCode, 200)
        test.equal(response.headers['content-type'], 'text/plain')
        simpleConcat(response, function (error, buffer) {
          test.error(error)
          test.assert(buffer.toString().includes('Disallow: /pay/'))
          finish()
        })
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
