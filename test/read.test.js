var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var has = require('has')
var http = require('http')
var runSeries = require('run-series')
var server = require('./server')
var simpleConcat = require('simple-concat')
var tape = require('tape')
var uuid = require('uuid/v4')
var writeTestLicensor = require('./write-test-licensor')

tape('read', function (test) {
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
      function request (done) {
        apiRequest(port, {
          action: 'read',
          offerID
        }, function (error, response) {
          if (error) return done(error)
          test.assert(
            !has(response, 'stripe'),
            'no Stripe data'
          )
          test.deepEqual(
            response, {
              offerID,
              url: OFFER.url,
              pricing: OFFER.pricing,
              licensor: {
                licensorID: LICENSOR.id,
                name: LICENSOR.name,
                jurisdiction: LICENSOR.jurisdiction,
                publicKey: LICENSOR.publicKey
              },
              description: OFFER.description,
              commission: parseInt(process.env.COMMISSION),
              error: false
            },
            'response'
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

tape('nonexistent offer', function (test) {
  server(function (port, close) {
    apiRequest(port, {
      action: 'read',
      offerID: uuid()
    }, function (error, response) {
      if (error) {
        test.error(error)
      } else {
        test.equal(response.error, 'no such offer')
      }
      test.end()
      close()
    })
  })
})

tape('/offer/{id}', function (test) {
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
          .then(() => browser.$('.offerID'))
          .then((element) => element.getText())
          .then(function (text) {
            test.equal(
              text, offerID,
              'offer ID'
            )
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

tape('/offer/{id}/badge.svg', function (test) {
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
        http.request({
          port,
          path: 'http://localhost:' + port + '/ids/' + offerID + '/badge.svg'
        })
          .once('error', function (error) {
            done(error)
          })
          .once('response', function (response) {
            test.equal(response.statusCode, 200, '200')
            simpleConcat(response, function (error, body) {
              test.error(error, 'no body error')
              test.equal(
                response.headers['content-type'],
                'image/svg+xml',
                'SVG'
              )
              done()
            })
          })
          .end()
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})
