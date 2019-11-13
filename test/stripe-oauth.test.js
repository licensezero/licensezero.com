var apiRequest = require('./api-request')
var email = require('../email')
var has = require('has')
var http = require('http')
var parseJSON = require('json-parse-errback')
var runSeries = require('run-series')
var server = require('./server')
var simpleConcat = require('simple-concat')
var tape = require('tape')

var LICENSOR_EMAIL = 'licensor@example.com'
var LICENSOR_JURISDICTION = 'US-TX'
var LICENSOR_NAME = 'Test Licensor'

var SPONSOR_EMAIL = 'sponsor@example.com'
var SPONSOR_JURISDICTION = 'US-MD'
var SPONSOR_NAME = 'Larry Licensee'

var options = {
  skip: (
    !has(process.env, 'STRIPE_SECRET_KEY') ||
    !has(process.env, 'STRIPE_PUBLISHABLE_KEY') ||
    !has(process.env, 'STRIPE_CLIENT_ID')
  )
}

tape('Stripe OAuth connect, register, license', options, function (suite) {
  server(8080, function (port, close) {
    withLicensor(port, suite, function (error, licensorID, token) {
      if (error) {
        suite.error(error)
        suite.end()
        return close()
      }

      var count = 0
      function closeServer () {
        if (++count === 2) close()
      }

      suite.test('license', function (test) {
        var offerID
        var paymentLocation
        var importPurchaseCommand
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
              description: 'a test offer',
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
          function order (done) {
            apiRequest(port, {
              action: 'order',
              offers: [offerID],
              licensee: 'Larry Licensee',
              jurisdiction: 'US-CA',
              email: 'licensee@example.com',
              person: 'I am a person, not a legal entity.'
            }, function (error, response) {
              if (error) return done(error)
              test.equal(response.error, false, 'order error false')
              test.assert(
                response.location.indexOf('/pay/') === 0,
                'location'
              )
              paymentLocation = response.location
              done()
            })
          },
          function pay (done) {
            var browser
            require('./webdriver')()
              .then((loaded) => { browser = loaded })
              .then(() => browser.url('http://localhost:' + port + paymentLocation))
              // Enter credit card.
              .then(() => browser.$('iframe'))
              .then((frame) => browser.switchToFrame(frame))
              .then(() => browser.$('input[name="cardnumber"]'))
              .then((input) => input.setValue('4242424242424242'))
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
              .then((text) => { test.equal(text, 'Thank You') })
              .then(() => browser.$('.import'))
              .then((element) => element.getText())
              .then(function (text) {
                importPurchaseCommand = text
                browser.deleteSession()
                done()
              })
              .catch(function (error) {
                browser.deleteSession()
                done(error)
              })
          },
          function fetchBundle (done) {
            var pathname = /\/purchases\/[0-9a-f-]+/
              .exec(importPurchaseCommand)[0]
            http.request({ port, path: pathname })
              .once('error', done)
              .once('response', function (response) {
                simpleConcat(response, function (error, body) {
                  if (error) return done(error)
                  parseJSON(body, function (error, parsed) {
                    if (error) return done(error)
                    test.equal(
                      typeof parsed.date, 'string',
                      'date'
                    )
                    test.assert(
                      Array.isArray(parsed.licenses),
                      'array of licenses'
                    )
                    done()
                  })
                })
              })
              .end()
          }
        ], function (error) {
          test.error(error, 'no error')
          test.end()
          closeServer()
        })
      })

      suite.test('sponsor', function (test) {
        var offerID
        var paymentLocation
        var notificationMessage
        var agreementMessage
        var relicensePrice = 100000
        var formattedPrice = '$1000.00'
        var homepage = 'http://example.com/repo'
        var description = 'some offer to relicense'
        runSeries([
          function offer (done) {
            apiRequest(port, {
              action: 'offer',
              licensorID,
              token,
              homepage,
              pricing: {
                private: 500,
                relicense: relicensePrice
              },
              description,
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
          function relicenseTheOffer (done) {
            apiRequest(port, {
              action: 'sponsor',
              offerID,
              sponsor: SPONSOR_NAME,
              jurisdiction: SPONSOR_JURISDICTION,
              email: SPONSOR_EMAIL
            }, function (error, response) {
              if (error) return done(error)
              test.equal(response.error, false, 'relicense error false')
              test.assert(
                response.location.indexOf('/pay/') === 0,
                'location'
              )
              paymentLocation = response.location
              done()
            })
          },
          function pay (done) {
            var called = 0
            function twoPhaseDone () {
              if (++called === 2) done()
            }

            email.events.on('message', function (message) {
              if (message.subject === 'License Zero Relicense Agreement') {
                agreementMessage = message
              } else if (message.subject === 'License Zero Relicense') {
                notificationMessage = message
              }
              if (agreementMessage && notificationMessage) {
                email.events.removeAllListeners('message')
                twoPhaseDone()
              }
            })

            var browser
            require('./webdriver')()
              .then((loaded) => { browser = loaded })
              .then(() => browser.url('http://localhost:' + port + paymentLocation))
              // Enter credit card.
              .then(() => browser.$('iframe'))
              .then((iframe) => browser.switchToFrame(iframe))
              .then(() => browser.$('input[name="cardnumber"]'))
              .then((input) => input.setValue('4242424242424242'))
              .then(() => browser.$('input[name="exp-date"]'))
              .then((input) => input.setValue('10 / 31'))
              .then(() => browser.$('input[name="cvc"]'))
              .then((input) => input.setValue('123'))
              .then(() => browser.$('input[name="postal"]'))
              .then((input) => input.setValue('12345'))
              .then(() => browser.switchToParentFrame())
              .then(() => browser.$('input[name="terms"]'))
              .then((input) => input.scrollIntoView())
              .then(() => browser.$('input[name="terms"]'))
              .then((element) => element.click())
              .then(() => browser.$('input[type="submit"]'))
              .then((input) => input.click())
              .then(() => browser.$('h1.thanks'))
              .then((h1) => h1.getText())
              .then(function (text) {
                test.equal(text, 'Thank You')
                browser.deleteSession()
                twoPhaseDone()
              })
              .catch(function (error) {
                browser.deleteSession()
                test.error(error)
                done()
              })
          },
          function checkAgreementEmail (done) {
            var message = agreementMessage
            var text = agreementMessage.text
            test.assert(text.includes(formattedPrice), 'e-mail shows price')
            test.equal(message.to, SPONSOR_EMAIL, 'e-mail to sponsor')
            test.equal(message.cc, LICENSOR_EMAIL, 'e-mail cc licensor')
            test.assert(text.includes(offerID), 'e-mail offer ID')
            test.assert(text.includes(homepage), 'e-mail homepage')
            test.assert(text.includes(description), 'e-mail description')
            done()
          },
          function checkAgreement (done) {
            var text = agreementMessage.agreement
            test.assert(text.includes('License Zero Relicense Agreement'), 'agreement title')
            test.assert(text.includes(offerID), 'agreement offer ID')
            test.assert(text.includes(formattedPrice), 'agreement price')
            test.assert(text.includes(LICENSOR_NAME), 'agreement licensor name')
            test.assert(text.includes(LICENSOR_JURISDICTION), 'agreement licensor jurisdiction')
            test.assert(text.includes(SPONSOR_NAME), 'agreement sponsor name')
            test.assert(text.includes(SPONSOR_JURISDICTION), 'agreement sponsor jurisdiction')
            done()
          },
          function checkLicensorNotification (done) {
            var message = notificationMessage
            var text = notificationMessage.text
            test.assert(text.includes(formattedPrice), 'notification price')
            test.equal(message.to, LICENSOR_EMAIL, 'notification to licensor')
            test.assert(text.includes(offerID), 'notification offer ID')
            test.assert(text.includes(homepage), 'notification homepage')
            test.assert(text.includes(description), 'notification description')
            done()
          }
        ], function (error) {
          test.error(error, 'no error')
          test.end()
          closeServer()
        })
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
          test.error(error)
        } else {
          test.equal(response.error, false, 'no error')
        }
      })
    },
    function authorize (done) {
      var browser
      require('./webdriver')()
        .then((loaded) => { browser = loaded })
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
