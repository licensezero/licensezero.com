var http = require('http')
var server = require('./server')
var tape = require('tape')

tape('GET /buy.js', function (test) {
  server(function (port, configuration, close) {
    http.request({port: port, path: '/buy.js'})
      .once('response', function (response) {
        test.equal(response.statusCode, 200)
        test.equal(
          response.headers['content-type'],
          'application/javascript'
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
