var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var uuid = require('uuid/v4')
var writeTestLicensor = require('./write-test-licensor')

tape.skip('buy', function (test) {
  server(function (port, service, close) {
    var firstProduct
    var secondProduct
    var location
    runSeries([
      writeTestLicensor.bind(null, service),
      function offerFirst (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          repository: 'http://example.com/first'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          firstProduct = response.product
          done()
        })
      },
      function offerSecond (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          repository: 'http://example.com/first'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          secondProduct = response.product
          done()
        })
      },
      function order (done) {
        apiRequest(port, {
          action: 'order',
          products: [firstProduct, secondProduct],
          licensee: 'SomeCo, Inc.',
          jurisdiction: 'US-CA',
          tier: 'team'
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'order error false')
          test.assert(
            response.location.indexOf('/pay/') === 0,
            'location'
          )
          location = response.location
          done()
        })
      },
      function pay (done) {
        var webdriver = require('./webdriver')
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
          // .saveScreenshot('screen.png')
          .click('input[type="submit"]')
          .waitForExist('h1')
          .getText('h1.thanks')
          .then(function (text) {
            test.equal(text, 'Thank You')
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

tape('order w/ nonexistent', function (test) {
  server(function (port, service, close) {
    var product = uuid()
    apiRequest(port, {
      action: 'order',
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

tape('order w/ retracted', function (test) {
  server(function (port, service, close) {
    var productID
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          productID = response.product
          done()
        })
      },
      function retract (done) {
        apiRequest(port, {
          action: 'retract',
          productID: productID,
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'retract error false')
          done()
        })
      },
      function order (done) {
        apiRequest(port, {
          action: 'order',
          products: [productID],
          licensee: 'SomeCo, Inc.',
          jurisdiction: 'US-CA',
          tier: 'solo'
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error,
            'retracted products: ' + productID,
            'retracted error'
          )
          done()
        })
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('POST /buy', function (test) {
  server(function (port, service, close) {
    var productID
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          productID = response.product
          done()
        })
      },
      function browse (done) {
        require('./webdriver')
          .url('http://localhost:' + port + '/products/' + productID)
          .waitForExist('h2')
          .setValue('#licensee', 'SomeCo, Inc.')
          .selectByIndex('#jurisdiction', 0)
          .selectByIndex('#tier', 1)
          .click('button[type="submit"]')
          .waitForExist('iframe')
          .getText('h2')
          .then(function (text) {
            test.equal(text, 'Credit Card Payment', 'credit card')
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
