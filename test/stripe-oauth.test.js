var apiRequest = require('./api-request')
var email = require('../email')
var has = require('has')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var timeout = require('./timeout')

var LICENSOR_EMAIL = 'licensor@example.com'
var LICENSOR_JURISDICTION = 'US-TX'
var LICENSOR_NAME = 'Test Licensor'

var options = {
  skip: (
    !has(process.env, 'STRIPE_SECRET_KEY') ||
    !has(process.env, 'STRIPE_PUBLISHABLE_KEY') ||
    !has(process.env, 'STRIPE_CLIENT_ID')
  )
}

tape('Stripe OAuth connect, register, license', options, function (test) {
  server(8080, function (port, close) {
    withLicensor(port, test, function (error, licensorID, token) {
      if (error) {
        test.error(error)
        test.end()
        return close()
      }

      var projectID
      runSeries([
        function offer (done) {
          apiRequest(port, {
            action: 'offer',
            licensorID,
            token,
            homepage: 'http://example.com',
            pricing: {
              private: 500
            },
            description: 'a test project',
            terms: (
              'I agree to the agency terms at ' +
              'https://licensezero.com/terms/agency.'
            )
          }, function (error, response) {
            if (error) return done(error)
            test.equal(response.error, false, 'offer error false')
            test.assert(has(response, 'projectID'), 'project id')
            projectID = response.projectID
            done()
          })
        },
        function orderAndPay (done) {
          var browser, cardNumber
          require('./webdriver')()
            .then((loaded) => { browser = loaded })
            // Order
            .then(() => browser.setTimeouts(1000))
            .then(() => browser.url('http://localhost:' + port + '/offers/' + projectID))
            .then(() => browser.$('#licensee'))
            .then((input) => input.setValue('Larry Licensee'))
            .then(() => browser.$('#jurisdiction'))
            .then((input) => input.setValue('US-CA'))
            .then(() => browser.$('#email'))
            .then((input) => input.setValue('licensee@test.com'))
            .then(() => browser.$('button[type="submit"]'))
            .then((button) => button.click())
            // Pay
            .then(() => browser.$('iframe'))
            .then((frame) => browser.switchToFrame(frame))
            .then(() => browser.$('input[name="cardnumber"]'))
            .then((input) => { cardNumber = input })
            .then(() => cardNumber.addValue('42'))
            .then(() => timeout(200))
            .then(() => cardNumber.addValue('42'))
            .then(() => timeout(200))
            .then(() => cardNumber.addValue('42'))
            .then(() => timeout(200))
            .then(() => cardNumber.addValue('42'))
            .then(() => timeout(200))
            .then(() => cardNumber.addValue('42'))
            .then(() => timeout(200))
            .then(() => cardNumber.addValue('42'))
            .then(() => timeout(200))
            .then(() => cardNumber.addValue('42'))
            .then(() => timeout(200))
            .then(() => cardNumber.addValue('42'))
            .then(() => browser.$('input[name="exp-date"]'))
            .then((input) => input.setValue('10 / 31'))
            .then(() => browser.$('input[name="cvc"]'))
            .then((input) => input.setValue('123'))
            .then(() => browser.$('input[name="postal"]'))
            .then((input) => input.setValue('12345'))
            .then(() => browser.switchToParentFrame())
            // Terms
            .then(() => browser.$('input[name="terms"]'))
            .then((input) => input.scrollIntoView())
            .then(() => browser.$('input[name="terms"]'))
            .then((input) => input.click())
            // Submit
            .then(() => browser.$('input[type="submit"]'))
            .then((input) => input.scrollIntoView())
            .then(() => browser.$('input[type="submit"]'))
            .then((element) => element.click())
            .then(() => browser.$('h1.thanks'))
            .then((h1) => h1.getText())
            .then((text) => {
              test.equal(text, 'Thank You')
              browser.deleteSession()
              done()
            })
            .catch(function (error) {
              browser.deleteSession()
              done(error)
            })
        }
      ], function (error) {
        test.ifError(error, 'no error')
        test.end()
        close()
      })
    })
  })
})

function withLicensor (port, test, callback) {
  var oauthLocation
  var licensorID
  var token
  runSeries([
    function register (done) {
      email.events.once('message', function (message) {
        message.text.split('\n').forEach(function (line) {
          if (line.includes('<https://connect.stripe.com')) {
            oauthLocation = /<(https:\/\/connect.stripe.com.+)>/.exec(line)[1]
          }
        })
        done()
      })
      apiRequest(port, {
        action: 'register',
        email: LICENSOR_EMAIL,
        name: LICENSOR_NAME,
        jurisdiction: LICENSOR_JURISDICTION,
        terms: (
          'I agree to the terms of service at ' +
          'https://licensezero.com/terms/service.'
        )
      }, function (error, response) {
        if (error) {
          test.ifError(error)
        } else {
          test.equal(response.error, false, 'no error')
        }
      })
    },
    function authorize (done) {
      var browser
      require('./webdriver')()
        .then((loaded) => { browser = loaded })
        .then(() => browser.setTimeouts(1000))
        .then(() => browser.url(oauthLocation))
        .then(() => browser.$('=Skip this account form'))
        .then((element) => element.click())
        .then(() => browser.$('span.id'))
        .then((element) => element.getText())
        .then(function (text) {
          licensorID = text
        })
        .then(() => browser.$('code.token'))
        .then((code) => code.getText())
        .then(function (text) {
          token = text
        })
        .then(function () {
          browser.deleteSession()
          done()
        })
        .catch(function (error) {
          browser.deleteSession()
          done(error)
        })
    }
  ], function (error) {
    if (error) return callback(error)
    callback(null, licensorID, token)
  })
}
