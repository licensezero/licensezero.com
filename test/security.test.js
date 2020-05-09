var http = require('http')
var server = require('./server')
var simpleConcat = require('simple-concat')
var tape = require('tape')

tape('GET /.well-known/security.txt', function (test) {
  server(function (port, close) {
    http.request({ port, path: '/.well-known/security.txt' })
      .once('response', function (response) {
        test.equal(response.statusCode, 200)
        test.equal(response.headers['content-type'], 'text/plain')
        simpleConcat(response, function (error, buffer) {
          test.ifError(error)
          test.assert(buffer.toString().includes('security@artlessdevices.com'))
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

tape('GET /security-pgp-key.txt', function (test) {
  server(function (port, close) {
    http.request({ port, path: '/security-pgp-key.txt' })
      .once('response', function (response) {
        test.equal(response.statusCode, 200)
        test.equal(response.headers['content-type'], 'text/plain')
        simpleConcat(response, function (error, buffer) {
          test.ifError(error)
          test.assert(buffer.toString().includes('BEGIN PGP PUBLIC KEY BLOCK'))
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
