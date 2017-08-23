var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var ecb = require('ecb')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var uuid = require('uuid/v4')
var writeTestLicensor = require('./write-test-licensor')

tape('reoffer', function (test) {
  server(function (port, service, close) {
    var reoffered = {
      id: LICENSOR.id,
      password: LICENSOR.password,
      action: 'reoffer',
      repository: 'http://example.com/elsewhere',
      price: 50,
      term: 90,
      grace: 7,
      jurisdictions: ['US-TX'],
      terms: 'I agree with the latest public terms of service.'
    }
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          id: LICENSOR.id,
          password: LICENSOR.password
        }), ecb(done, function (response) {
          test.equal(response.error, false, 'error false')
          reoffered.product = response.product
          done()
        }))
      },
      function reoffer (done) {
        apiRequest(port, reoffered, ecb(done, function (response) {
          test.equal(response.error, false, 'reoffer error false')
          done()
        }))
      },
      function requestProduct (done) {
        apiRequest(port, {
          action: 'product',
          product: reoffered.product
        }, ecb(done, function (response) {
          test.equal(response.error, false, 'false error')
          ;['repository', 'price', 'term', 'grace', 'jurisdictions']
            .forEach(function (key) {
              test.deepEqual(response[key], reoffered[key], key)
            })
          done()
        }))
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('reoffer nonexistent', function (test) {
  server(function (port, service, close) {
    var reoffered = {
      id: LICENSOR.id,
      password: LICENSOR.password,
      action: 'reoffer',
      product: uuid(),
      repository: 'http://example.com/elsewhere',
      price: 50,
      term: 90,
      grace: 7,
      jurisdictions: ['US-TX'],
      terms: 'I agree with the latest public terms of service.'
    }
    runSeries([
      writeTestLicensor.bind(null, service),
      function reoffer (done) {
        apiRequest(port, reoffered, ecb(done, function (response) {
          test.equal(response.error, 'no such product', 'no such product')
          done()
        }))
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})
