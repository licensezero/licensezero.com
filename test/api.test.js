var apiRequest = require('./api-request')
var http = require('http')
var server = require('./server')
var tape = require('tape')

tape('non-object API payload', function (test) {
  server(function (port, close) {
    apiRequest(port, null, function (error, response) {
      test.error(error, 'no HTTP error')
      test.equal(
        response.error, 'request not an object',
        'request not an object'
      )
      test.end()
      close()
    })
  })
})

tape('payload without action', function (test) {
  server(function (port, close) {
    apiRequest(port, {}, function (error, response) {
      test.error(error, 'no HTTP error')
      test.equal(
        response.error, 'missing action property',
        'missing action property'
      )
      test.end()
      close()
    })
  })
})

tape('payload with invalid action', function (test) {
  server(function (port, close) {
    apiRequest(port, {action: 'invalid'}, function (error, response) {
      test.error(error, 'no HTTP error')
      test.equal(
        response.error, 'invalid action',
        'invalid action'
      )
      test.end()
      close()
    })
  })
})

tape('oversize payload', function (test) {
  server(function (port, close) {
    http.request({
      method: 'POST',
      port: port,
      path: '/api/v0'
    })
      .once('error', function (error) {
        test.equal(
          error.message, 'socket hang up',
          'socket hang up'
        )
        test.end()
        close()
      })
      .end(JSON.stringify({key: 'x'.repeat(500001)}))
  })
})
