var http = require('http')
var server = require('./server')
var simpleConcat = require('simple-concat')
var tape = require('tape')

testForm('waiver')
testForm('noncommercial')
testForm('reciprocal')
testForm('parity')
testForm('charity')
testForm('prosperity')
testForm('private')

function testForm (form) {
  tape('GET /licenses/' + form, function (test) {
    server(function (port, close) {
      http.request({ port, path: '/licenses/' + form })
        .once('error', function (error) {
          test.ifError(error, 'no error')
          finish()
        })
        .once('response', function (response) {
          test.equal(response.statusCode, 200, '200')
          simpleConcat(response, function (error, body) {
            test.ifError(error, 'no body error')
            var string = body.toString()
            test.assert(
              string.includes('<blockquote class=form>') ||
              string.includes('<pre class=form>'),
              'has <element class=form>'
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
}

tape.test('relicense', function (test) {
  server(function (port, close) {
    http.request({ port, path: '/licenses/relicense' })
      .once('error', function (error) {
        test.ifError(error, 'no error')
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
