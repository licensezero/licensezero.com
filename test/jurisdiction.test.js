var http = require('http')
var server = require('./server')
var simpleConcat = require('simple-concat')
var tape = require('tape')

tape('GET /jurisdictions.json', function (test) {
  server(function (port, close) {
    http.request({ port, path: '/jurisdictions.json' })
      .once('error', function (error) {
        test.ifError(error, 'no error')
        finish()
      })
      .once('response', function (response) {
        test.equal(response.statusCode, 200, '200')
        simpleConcat(response, function (error, body) {
          test.ifError(error, 'no body error')
          var parsed
          try {
            parsed = JSON.parse(body)
          } catch (error) {
            test.ifError(error)
          }
          test.assert(Array.isArray(parsed), 'array')
          test.assert(
            parsed.every(function (element) {
              return typeof element === 'string'
            }),
            'all strings'
          )
          finish()
        })
      })
      .end()
    function finish () {
      test.end()
      close()
    }
  })
})
