var apiRequest = require('./api-request')
var server = require('./server')
var tape = require('tape')

tape('register w/ invalid body', function (test) {
  server(function (port, close) {
    apiRequest(port, {
      action: 'key'
    }, function (error, response) {
      if (error) {
        test.ifError(error)
      } else {
        test.assert(
          /^[0-9a-f]{64}$/.test(response.key),
          'ed25519 public key'
        )
      }
      test.end()
      close()
    })
  })
})
