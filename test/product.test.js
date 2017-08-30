var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var ecb = require('ecb')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var uuid = require('uuid/v4')
var writeTestLicensor = require('./write-test-licensor')

tape('product', function (test) {
  server(function (port, service, close) {
    var productID
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }), ecb(done, function (response) {
          test.equal(response.error, false, 'error false')
          productID = response.product
          done()
        }))
      },
      function requestProduct (done) {
        apiRequest(port, {
          action: 'product',
          productID: productID
        }, ecb(done, function (response) {
          test.assert(
            !response.hasOwnProperty('stripe'),
            'no Stripe data'
          )
          test.deepEqual(
            response, {
              productID: productID,
              repository: OFFER.repository,
              grace: OFFER.grace,
              pricing: OFFER.pricing,
              licensor: {
                licensorID: LICENSOR.id,
                name: LICENSOR.name,
                jurisdiction: LICENSOR.jurisdiction,
                publicKey: LICENSOR.publicKey
              },
              description: OFFER.description,
              error: false
            },
            'response'
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

tape('nonexistent product', function (test) {
  server(function (port, service, close) {
    apiRequest(port, {
      action: 'product',
      productID: uuid()
    }, function (error, response) {
      if (error) {
        test.error(error)
      } else {
        test.equal(response.error, 'no such product')
      }
      test.end()
      close()
    })
  })
})

tape('/product/{id}', function (test) {
  server(function (port, service, close) {
    var productID
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }), ecb(done, function (response) {
          test.equal(response.error, false, 'error false')
          productID = response.product
          done()
        }))
      },
      function browse (done) {
        require('./webdriver')
          .url('http://localhost:' + port + '/products/' + productID)
          .waitForExist('h2')
          .getText('h2')
          .then(function (text) {
            test.equal(
              text, 'Product ' + productID,
              'product header'
            )
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
