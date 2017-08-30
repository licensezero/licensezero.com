var NAME = require('../package.json').name
var VERSION = require('../package.json').version
var apiRequest = require('./api-request')
var server = require('./server')
var tape = require('tape')

tape('version', function (test) {
  server(function (port, service, close) {
    apiRequest(port, {
      action: 'version'
    }, function (error, response) {
      test.error(error, 'no error')
      test.equal(response.service, NAME, 'service')
      test.equal(response.version, VERSION, 'version')
      test.end()
      close()
    })
  })
})
