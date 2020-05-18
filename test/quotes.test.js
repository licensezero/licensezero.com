var MIME = 'application/vnd.oasis.opendocument.text'
var http = require('http')
var server = require('./server')
var tape = require('tape')

testQuote('relicense')

function testQuote (type) {
  var path = '/licenses/quotes/' + type + '.odt'
  tape('GET ' + path, function (test) {
    server(function (port, close) {
      http.request({ port, path })
        .once('error', function (error) {
          test.ifError(error, 'no error')
          finish()
        })
        .once('response', function (response) {
          test.equal(response.statusCode, 200, '200')
          test.equal(
            response.headers['content-type'], MIME,
            'content-type'
          )
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
