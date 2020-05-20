var apiRequest = require('./api-request')
var email = require('../email')
var formatPrice = require('../util/format-price')
var has = require('has')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var timeout = require('./timeout')

var DEVELOPER_EMAIL = 'developer@example.com'
var DEVELOPER_JURISDICTION = 'US-TX'
var DEVELOPER_NAME = 'Test Developer'

var USER_EMAIL = 'licensee@test.com'
var USER_JURISDICTION = 'US-CA'
var USER_NAME = 'Larry Licensee'

var HOMEPAGE = 'https://example.com'
var DESCRIPTION = 'test project'

var PRICE = 500

var options = {
  skip: (
    !has(process.env, 'STRIPE_SECRET_KEY') ||
    !has(process.env, 'STRIPE_PUBLISHABLE_KEY') ||
    !has(process.env, 'STRIPE_CLIENT_ID')
  )
}

tape('Stripe OAuth connect, register, license', options, function (test) {
  server(8080, function (port, close) {
    withDeveloper(port, test, function (error, developerID, token) {
      if (error) {
        test.error(error)
        test.end()
        return close()
      }

      var offerID
      runSeries([
        function offer (done) {
          apiRequest(port, {
            action: 'offer',
            developerID,
            token,
            homepage: HOMEPAGE,
            pricing: {
              private: PRICE
            },
            description: DESCRIPTION,
            terms: (
              'I agree to the agency terms at ' +
              'https://licensezero.com/terms/agency.'
            )
          }, function (error, response) {
            if (error) return done(error)
            test.equal(response.error, false, 'offer error false')
            test.assert(has(response, 'offerID'), 'offer id')
            offerID = response.offerID
            done()
          })
        },
        function orderAndPay (done) {
          var browser, cardNumber
          require('./webdriver')()
            .then((loaded) => { browser = loaded })
            // Order
            .then(() => browser.setTimeouts(1000))
            .then(() => browser.url('http://localhost:' + port + '/offers/' + offerID))
            .then(() => browser.$('#licensee'))
            .then((input) => input.setValue(USER_NAME))
            .then(() => browser.$('#jurisdiction'))
            .then((input) => input.setValue(USER_JURISDICTION))
            .then(() => browser.$('#email'))
            .then((input) => input.setValue(USER_EMAIL))
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
              complete()
            })
            .catch(function () {
              browser.deleteSession()
              complete()
            })

          email.events.once('message', function (message) {
            test.assert(
              message.subject.includes('Receipt and License'),
              'subject: ... Receipt and License ...'
            )

            // E-Mail Text
            var text = message.text
            // User
            test.assert(text.includes(USER_NAME), 'user name in text')
            test.assert(text.includes(USER_EMAIL), 'user e-mail in text')
            test.assert(text.includes(USER_JURISDICTION), 'user jurisdiction in text')
            // Offer
            test.assert(text.includes(offerID), 'offer ID in text')
            // Project
            test.assert(text.includes(HOMEPAGE), 'homepage in text')
            test.assert(text.includes(DESCRIPTION), 'description in text')

            // License
            var license = message.license
            var meta = license.metadata
            // Transaction
            test.equal(meta.price, formatPrice(PRICE), 'price')
            test.equal(meta.term, 'forever', 'term')
            test.equal(meta['offer identifier'], offerID, 'term')
            // User
            test.equal(meta['user name'], USER_NAME, 'user name in license')
            test.equal(meta['user e-mail'], USER_EMAIL, 'user e-mail in license')
            test.equal(meta['user jurisdiction'], USER_JURISDICTION, 'user jurisdiction in license')
            // Developer
            test.equal(meta['developer name'], DEVELOPER_NAME, 'developer name in license')
            test.equal(meta['developer e-mail'], DEVELOPER_EMAIL, 'developer e-mail in license')
            test.equal(meta['developer jurisdiction'], DEVELOPER_JURISDICTION, 'developer jurisdiction in license')
            // Agent
            test.equal(meta['agent name'], 'Artless Devices LLC', 'agent name in license')
            test.equal(meta['agent jurisdiction'], 'US-CA', 'agent jurisdiction in license')
            test.equal(meta['agent website'], 'https://artlessdevices.com', 'agent website in license')

            // Text
            var document = license.document
            // Transaction
            test.assert(document.includes(formatPrice(PRICE)), 'price in document')
            test.assert(document.includes('forever'), 'term in document')
            // Form
            test.assert(document.includes('Private License'), 'Private License in document')
            test.assert(document.includes('Private License'), 'Private License in document')
            // User
            test.assert(document.includes(USER_NAME), 'user name in document')
            test.assert(document.includes(USER_EMAIL), 'user e-mail in document')
            test.assert(document.includes(USER_JURISDICTION), 'user jurisdiction in document')
            // Offer
            test.assert(document.includes(offerID), 'offer ID in document')
            // Project
            test.assert(document.includes(HOMEPAGE), 'homepage in document')
            test.assert(document.includes(DESCRIPTION), 'description in document')

            complete()
          })

          var completed = 0
          function complete () {
            if (++completed === 2) done()
          }
        }
      ], function (error) {
        test.ifError(error, 'no error')
        test.end()
        close()
      })
    })
  })
})

function withDeveloper (port, test, callback) {
  var oauthLocation
  var developerID
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
        email: DEVELOPER_EMAIL,
        name: DEVELOPER_NAME,
        jurisdiction: DEVELOPER_JURISDICTION,
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
          developerID = text
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
    callback(null, developerID, token)
  })
}
