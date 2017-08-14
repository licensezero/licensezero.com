var http = require('http')
var server = require('./server')
var tape = require('tape')

tape('GET /nonexistent', function (test) {
  server(function (port, configuration, done) {
    http.request({
      port: port,
      path: '/nonexistent'
    })
      .once('response', function (response) {
        test.equal(response.statusCode, 404, '404')
        test.end()
        done()
      })
      .once('error', function (error) {
        test.fail(error, 'no error')
        test.end()
        done()
      })
      .end()
  })
})
