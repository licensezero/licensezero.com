var developer = require('./developer')
var OFFER = require('./offer')
var UUIDV4 = require('../data/uuidv4-pattern')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var has = require('has')
var server = require('./server')
var tape = require('tape')
var writeTestDeveloper = require('./write-test-developer')

tape('offer', function (test) {
  server(function (port, close) {
    writeTestDeveloper(function (error) {
      test.ifError(error)
      apiRequest(port, Object.assign(clone(OFFER), {
        developerID: developer.id,
        token: developer.token
      }), function (error, response) {
        test.ifError(error)
        test.equal(
          response.error, false,
          'error false'
        )
        test.assert(
          has(response, 'offerID'),
          'offerID'
        )
        test.assert(
          new RegExp(UUIDV4).test(response.offerID),
          'UUIDv4'
        )
        test.end()
        close()
      })
    })
  })
})

tape('offer w/ relicense', function (test) {
  server(function (port, close) {
    writeTestDeveloper(function (error) {
      test.ifError(error)
      var request = clone(OFFER)
      request.pricing.relicense = 10000
      apiRequest(port, Object.assign(request, {
        developerID: developer.id,
        token: developer.token
      }), function (error, response) {
        test.ifError(error)
        test.equal(
          response.error, false,
          'error false'
        )
        test.assert(
          has(response, 'offerID'),
          'offerID'
        )
        test.assert(
          new RegExp(UUIDV4).test(response.offerID),
          'UUIDv4'
        )
        test.end()
        close()
      })
    })
  })
})
