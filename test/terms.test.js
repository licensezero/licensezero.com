var http = require('http')
var server = require('./server')
var simpleConcat = require('simple-concat')
var tape = require('tape')

sanityCheck('terms/service', 'Terms of Service')
sanityCheck('terms/agency', 'Agency Terms')
sanityCheck('privacy-notice', 'Privacy Notice')

function sanityCheck (path, header) {
  tape('GET /' + path, function (test) {
    server(function (port, configuration, close) {
      http.request({port: port, path: '/' + path})
        .once('response', function (response) {
          test.equal(response.statusCode, 200)
          test.equal(response.headers['content-type'], 'text/html')
          simpleConcat(response, function (error, body) {
            test.error(error)
            test.assert(
              body.toString().includes(header),
              header
            )
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
}
