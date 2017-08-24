var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var ecb = require('ecb')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var uuid = require('uuid/v4')
var webdriver = require('./webdriver')
var writeTestLicensor = require('./write-test-licensor')

tape('buy', function (test) {
  server(function (port, service, close) {
    var firstProduct
    var secondProduct
    var location
    runSeries([
      writeTestLicensor.bind(null, service),
      function offerFirst (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          id: LICENSOR.id,
          password: LICENSOR.password,
          repository: 'http://example.com/first'
        }), ecb(done, function (response) {
          test.equal(response.error, false, 'error false')
          firstProduct = response.product
          done()
        }))
      },
      function offerSecond (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          id: LICENSOR.id,
          password: LICENSOR.password,
          repository: 'http://example.com/first'
        }), ecb(done, function (response) {
          test.equal(response.error, false, 'error false')
          secondProduct = response.product
          done()
        }))
      },
      function buy (done) {
        apiRequest(port, {
          action: 'buy',
          products: [firstProduct, secondProduct],
          licensee: 'SomeCo, Inc.',
          jurisdiction: 'US-CA',
          tier: 'team'
        }, ecb(done, function (response) {
          test.equal(response.error, false, 'buy error false')
          test.assert(
            response.location.indexOf('/buy/') === 0,
            'location'
          )
          location = response.location
          done()
        }))
      },
      function visitBuyPage (done) {
        webdriver
          .url('http://localhost:' + port + location)
          .waitForExist('iframe')
          // Enter credit card.
          .element('iframe')
          .then(function (response) {
            return webdriver.frame(response.value)
          })
          .setValue('input[name="cardnumber"]', '4242 4242 4242 4242')
          .setValue('input[name="exp-date"]', '10 / 31')
          .setValue('input[name="cvc"]', '123')
          .waitForExist('input[name="postal"]')
          .setValue('input[name="postal"]', '12345')
          .frameParent()
          // E-Mail
          .setValue('input[name="email"]', 'customer@example.com')
          // Terms
          .click('input[name="terms"]')
          // Submit
          .click('input[type="submit"]')
          .then(function () {
            done()
          })
          .catch(done)
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('buy w/ nonexistent', function (test) {
  server(function (port, service, close) {
    var product = uuid()
    apiRequest(port, {
      action: 'buy',
      products: [product],
      licensee: 'SomeCo, Inc.',
      jurisdiction: 'US-CA',
      tier: 'solo'
    }, function (error, response) {
      test.error(error)
      test.equal(
        response.error, 'no such product: ' + product,
        'no such product'
      )
      test.end()
      close()
    })
  })
})

tape('buy w/ retracted', function (test) {
  server(function (port, service, close) {
    var product
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          id: LICENSOR.id,
          password: LICENSOR.password
        }), ecb(done, function (response) {
          test.equal(response.error, false, 'error false')
          product = response.product
          done()
        }))
      },
      function retract (done) {
        apiRequest(port, {
          action: 'retract',
          product: product,
          id: LICENSOR.id,
          password: LICENSOR.password
        }, ecb(done, function (response) {
          test.equal(response.error, false, 'retract error false')
          done()
        }))
      },
      function buy (done) {
        apiRequest(port, {
          action: 'buy',
          products: [product],
          licensee: 'SomeCo, Inc.',
          jurisdiction: 'US-CA',
          tier: 'solo'
        }, ecb(done, function (response) {
          test.equal(
            response.error,
            'retracted products: ' + product,
            'retracted error'
          )
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
