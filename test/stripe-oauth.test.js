var apiRequest = require('./api-request')
var ecb = require('ecb')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var webdriver = require('./webdriver')

tape('Stripe OAuth connect', function (test) {
  server(function (port, service, close) {
    var oauthLocation
    var licensorID
    var password
    var product
    var paymentLocation
    runSeries([
      function register (done) {
        service.email.events.once('message', function (message) {
          message.text.forEach(function (line) {
            if (line.indexOf('https://connect.stripe.com') === 0) {
              oauthLocation = line
            }
          })
          done()
        })
        apiRequest(port, {
          action: 'register',
          email: 'test@example.com',
          name: 'Test Licensor',
          jurisdiction: 'US-CA',
          terms: 'I agree to the latest published terms of service.'
        }, function (error, response) {
          if (error) {
            test.error(error)
          } else {
            test.equal(response.error, false, 'no error')
          }
        })
      },
      function authorize (done) {
        webdriver.url(oauthLocation)
          .waitForExist('=Skip this account form')
          .click('=Skip this account form')
          .getText('code.id')
          .then(function (text) {
            licensorID = text
          })
          .getText('code.token')
          .then(function (text) {
            password = text
          })
          .then(function () {
            done()
          })
          .catch(done)
      },
      function offer (done) {
        apiRequest(port, {
          action: 'offer',
          licensorID: licensorID,
          password: password,
          repository: 'http://example.com',
          pricing: {
            solo: 500,
            team: 1000,
            company: 5000,
            enterprise: 10000
          },
          grace: 180,
          description: 'a test project',
          terms: 'I agree to the latest published terms of service.'
        }, ecb(done, function (response) {
          test.equal(response.error, false, 'offer error false')
          test.assert(response.hasOwnProperty('product'), 'product id')
          product = response.product
          done()
        }))
      },
      function order (done) {
        apiRequest(port, {
          action: 'order',
          products: [product],
          licensee: 'SomeCo, Inc.',
          jurisdiction: 'US-CA',
          tier: 'team'
        }, ecb(done, function (response) {
          test.equal(response.error, false, 'order error false')
          test.assert(
            response.location.indexOf('/pay/') === 0,
            'location'
          )
          paymentLocation = response.location
          done()
        }))
      },
      function pay (done) {
        webdriver
          .url('http://localhost:' + port + paymentLocation)
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
          .waitForExist('h1.thanks', 10000)
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
