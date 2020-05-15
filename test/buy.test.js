var developer = require('./developer')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestDeveloper = require('./write-test-developer')

tape('POST /buy', function (test) {
  server(function (port, close) {
    var offerID
    runSeries([
      writeTestDeveloper.bind(null),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          developerID: developer.id,
          token: developer.token
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
          .then(() => browser.url('http://localhost:' + port + '/offers/' + offerID))
          .then(() => browser.$('#licensee'))
          .then((input) => input.setValue('Larry Licensee'))
          .then(() => browser.$('#jurisdiction'))
          .then((input) => input.setValue('US-CA'))
          .then(() => browser.$('#email'))
          .then((input) => input.setValue('licensee@test.com'))
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
      test.ifError(error, 'no error')
      test.end()
      close()
    })
  })
})
