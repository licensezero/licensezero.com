var http = require('http')
var server = require('./server')
var tape = require('tape')

var FILES = ['logo.svg', 'vending-machine.svg', 'normalize.css']
FILES.forEach(function (file) {
  tape('GET /' + file, function (test) {
    server(function (port, close) {
      http.request({ port, path: '/' + file })
        .once('error', function (error) {
          test.ifError(error, 'no error')
          finish()
        })
        .once('response', function (response) {
          test.equal(response.statusCode, 301, '301')
          test.assert(response.headers.location, 'location header')
          finish()
        })
        .end()
      function finish () {
        test.end()
        close()
      }
    })
  })
})
