var http = require('http')
var server = require('./server')
var tape = require('tape')

testCSS('normalize.css')
testCSS('styles.css')

function testCSS (file) {
  tape('GET /' + file, function (test) {
    server(function (port, configuration, close) {
      http.request({port: port, path: '/' + file})
        .once('response', function (response) {
          test.equal(response.statusCode, 200)
          test.equal(
            response.headers['content-type'],
            'text/css; charset=UTF-8'
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
}
