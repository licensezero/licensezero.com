var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var PERSON = 'I am a person, not a legal entity.'
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var uuid = require('uuid/v4')
var writeTestLicensor = require('./write-test-licensor')

tape.skip('buy', function (test) {
  if (
    !process.env.STRIPE_PUBLISHABLE_KEY ||
    !process.env.STRIPE_SECRET_KEY
  ) {
    test.fail('No Stripe environment variables.')
    return test.end()
  }

  server(function (port, close) {
    var firstProject
    var secondProject
    var location
    runSeries([
      writeTestLicensor.bind(null),
      function offerFirst (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          homepage: 'http://example.com/first'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          firstProject = response.offerID
          done()
        })
      },
      function offerSecond (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          homepage: 'http://example.com/first'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          secondProject = response.offerID
          done()
        })
      },
      function order (done) {
        apiRequest(port, {
          action: 'order',
          projects: [firstProject, secondProject],
          licensee: 'Larry Licensee',
          jurisdiction: 'US-CA',
          email: 'licensee@test.com',
          person: PERSON
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
        var browser
        require('./webdriver')()
          .then((loaded) => { browser = loaded })
          .then(() => browser.url('http://localhost:' + port + location))
          // Enter credit card.
          .then(() => browser.$('iframe'))
          .then((iframe) => browser.switchToFrame(iframe))
          .then(() => browser.$('input[name="cardnumber"]'))
          .then((input) => input.setValue('4242 4242 4242 4242'))
          .then(() => browser.$('input[name="exp-date"]'))
          .then((input) => input.setValue('10 / 31'))
          .then(() => browser.$('input[name="cvc"]'))
          .then((input) => input.setValue('123'))
          .then(() => browser.$('input[name="postal"]'))
          .then((input) => input.setValue('12345'))
          .then(() => browser.switchToParentFrame())
          // Accept terms.
          .then(() => browser.$('input[name="terms"]'))
          .then((input) => input.click())
          // Submit.
          .then(() => browser.$('input[type="submit"]'))
          .then((input) => input.click())
          .then(() => browser.$('h1.thanks'))
          .then((h1) => h1.waitForExist())
          .then(() => browser.$('h1.thanks'))
          .then((h1) => h1.getText())
          .then(function (text) {
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
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('order w/ nonexistent', function (test) {
  server(function (port, close) {
    var project = uuid()
    apiRequest(port, {
      action: 'order',
      projects: [project],
      licensee: 'Larry Licensee',
      jurisdiction: 'US-CA',
      email: 'licensee@test.com',
      person: PERSON
    }, function (error, response) {
      test.error(error)
      test.equal(
        response.error, 'no such project: ' + project,
        'no such project'
      )
      test.end()
      close()
    })
  })
})

tape('order w/ retracted', function (test) {
  server(function (port, close) {
    var offerID
    runSeries([
      writeTestLicensor.bind(null),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          offerID = response.offerID
          done()
        })
      },
      function retract (done) {
        apiRequest(port, {
          action: 'retract',
          offerID,
          licensorID: LICENSOR.id,
          token: LICENSOR.token
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'retract error false')
          done()
        })
      },
      function order (done) {
        apiRequest(port, {
          action: 'order',
          projects: [offerID],
          licensee: 'Larry Licensee',
          jurisdiction: 'US-CA',
          email: 'licensee@test.com',
          person: PERSON
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error,
            'retracted projects: ' + offerID,
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
  server(function (port, close) {
    var offerID
    runSeries([
      writeTestLicensor.bind(null),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          offerID = response.offerID
          done()
        })
      },
      function browse (done) {
        var browser
        require('./webdriver')()
          .then((loaded) => { browser = loaded })
          .then(() => browser.url('http://localhost:' + port + '/ids/' + offerID))
          .then(() => browser.$('#licensee'))
          .then((input) => input.setValue('Larry Licensee'))
          .then(() => browser.$('#jurisdiction'))
          .then((input) => input.setValue('US-CA'))
          .then(() => browser.$('#email'))
          .then((input) => input.setValue('licensee@test.com'))
          .then(() => browser.$('#person'))
          .then((input) => input.click())
          .then(() => browser.$('button[type="submit"]'))
          .then((button) => button.click())
          .then(() => browser.$('h2=Credit Card Payment'))
          .then((h2) => h2.getText())
          .then(function (text) {
            test.equal(text, 'Credit Card Payment', 'credit card')
            browser.deleteSession()
            done()
          })
          .catch(function (error) {
            browser.deleteSession()
            done(error)
          })
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})
