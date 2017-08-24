var http = require('http')
var server = require('./server')
var tape = require('tape')

tape('GET /styles.css', function (test) {
  server(function (port, configuration, close) {
    http.request({port: port, path: '/styles.css'})
      .once('response', function (response) {
        test.equal(response.statusCode, 200)
        test.equal(
          response.headers['content-type'],
          'text/css; charset=UTF-8'
        )
        test.end()
        close()
      })
      .once('error', function (error) {
        test.fail(error, 'no error')
        test.end()
        close()
      })
      .end()
  })
})
