var http = require('http')
var parse = require('json-parse-errback')
var server = require('./server')
var simpleConcat = require('simple-concat')
var tape = require('tape')

tape('GET /', function (test) {
  server(function (port, configuration, done) {
    http.request({
      port: port,
      path: '/'
    })
      .once('response', function (response) {
        simpleConcat(response, function (error, buffer) {
          test.ifError(error, 'no error')
          if (error) {
            test.end()
            done()
          } else {
            parse(buffer, function (error, parsed) {
              test.ifError(error, 'valid JSON')
              if (!error) {
                test.equal(
                  parsed.service, 'licensezero',
                  'server'
                )
                test.assert(
                  parsed.hasOwnProperty('version'),
                  'version'
                )
              }
              test.end()
              done()
            })
          }
        })
      })
      .once('error', function (error) {
        test.fail(error, 'no error')
        test.end()
        done()
      })
      .end()
  })
})
