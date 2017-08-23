var http = require('http')
var querystring = require('querystring')
var server = require('./server')
var tape = require('tape')

tape('GET /stripe-redirect', function (test) {
  server(function (port, configuration, close) {
    http.request({
      port: port,
      path: '/stripe-redirect'
    })
      .once('error', function (error) {
        test.error(error, 'no error')
        finish()
      })
      .once('response', function (response) {
        test.equal(response.statusCode, 400, '400')
        finish()
      })
      .end()
    function finish () {
      test.end()
      close()
    }
  })
})

tape('GET /stripe-redirect?error=&error_description=', function (test) {
  server(function (port, configuration, close) {
    http.request({
      port: port,
      path: '/stripe-redirect?' + querystring.stringify({
        error: 'bad',
        error_description: 'bad things'
      })
    })
      .once('error', function (error) {
        test.error(error, 'no error')
        finish()
      })
      .once('response', function (response) {
        test.equal(response.statusCode, 200, '200')
        finish()
      })
      .end()
    function finish () {
      test.end()
      close()
    }
  })
})

tape('GET /stripe-redirect w/ bad state', function (test) {
  server(function (port, configuration, close) {
    http.request({
      port: port,
      path: '/stripe-redirect?' + querystring.stringify({
        state: 'nonsense',
        code: 'nonsense',
        scope: 'read_write'
      })
    })
      .once('error', function (error) {
        test.error(error, 'no error')
        finish()
      })
      .once('response', function (response) {
        test.equal(response.statusCode, 400, '400')
        finish()
      })
      .end()
    function finish () {
      test.end()
      close()
    }
  })
})

tape('PUT /stripe-redirect', function (test) {
  server(function (port, configuration, close) {
    http.request({
      method: 'PUT',
      port: port,
      path: '/stripe-redirect'
    })
      .once('error', function (error) {
        test.error(error, 'no error')
        finish()
      })
      .once('response', function (response) {
        test.equal(response.statusCode, 405, '405')
        finish()
      })
      .end()
    function finish () {
      test.end()
      close()
    }
  })
})
