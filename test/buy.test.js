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
    var firstProject
    var secondProject
    var location
    runSeries([
      writeTestLicensor.bind(null, service),
      function offerFirst (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          repository: 'http://example.com/first'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          firstProject = response.projectID
          done()
        })
      },
      function offerSecond (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          repository: 'http://example.com/first'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          secondProject = response.projectID
          done()
        })
      },
      function order (done) {
        apiRequest(port, {
          action: 'order',
          projects: [firstProject, secondProject],
          licensee: 'Larry Licensee',
          jurisdiction: 'US-CA',
          email: 'licensee@test.com'
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
    var project = uuid()
    apiRequest(port, {
      action: 'order',
      projects: [project],
      licensee: 'Larry Licensee',
      jurisdiction: 'US-CA',
      email: 'licensee@test.com'
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
  server(function (port, service, close) {
    var projectID
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          projectID = response.projectID
          done()
        })
      },
      function retract (done) {
        apiRequest(port, {
          action: 'retract',
          projectID: projectID,
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
          projects: [projectID],
          licensee: 'Larry Licensee',
          jurisdiction: 'US-CA',
          email: 'licensee@test.com'
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.error,
            'retracted projects: ' + projectID,
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
    var projectID
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          projectID = response.projectID
          done()
        })
      },
      function browse (done) {
        require('./webdriver')
          .url('http://localhost:' + port + '/projects/' + projectID)
          .waitForExist('h2')
          .setValue('#licensee', 'Larry Licensee')
          .selectByIndex('#jurisdiction', 0)
          .setValue('#email', 'licensee@test.com')
          .click('button[type="submit"]')
          .waitForExist('iframe')
          .getText('h2=Credit Card Payment')
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
