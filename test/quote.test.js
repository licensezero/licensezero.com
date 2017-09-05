var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var uuid = require('uuid/v4')
var writeTestLicensor = require('./write-test-licensor')

tape('quote', function (test) {
  server(function (port, service, close) {
    var firstProduct
    var secondProduct
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
          repository: 'http://example.com/second'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          secondProduct = response.product
          done()
        })
      },
      function quote (done) {
        apiRequest(port, {
          action: 'quote',
          products: [firstProduct, secondProduct]
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          test.deepEqual(
            response.products,
            [
              {
                productID: firstProduct,
                description: OFFER.description,
                pricing: OFFER.pricing,
                repository: 'http://example.com/first',
                licensor: {
                  licensorID: LICENSOR.id,
                  name: 'Test User',
                  jurisdiction: 'US-CA',
                  publicKey: LICENSOR.publicKey
                },
                commission: service.commission
              },
              {
                productID: secondProduct,
                description: OFFER.description,
                pricing: OFFER.pricing,
                repository: 'http://example.com/second',
                licensor: {
                  licensorID: LICENSOR.id,
                  name: 'Test User',
                  jurisdiction: 'US-CA',
                  publicKey: LICENSOR.publicKey
                },
                commission: service.commission
              }
            ],
            'quotes terms'
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

tape('quote w/ nonexistent', function (test) {
  server(function (port, service, close) {
    var product = uuid()
    apiRequest(port, {
      action: 'quote',
      products: [product]
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

tape('quote w/ retracted', function (test) {
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
      function quote (done) {
        apiRequest(port, {
          action: 'quote',
          products: [productID]
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.products[0].productID, productID,
            'product'
          )
          test.equal(
            response.products[0].retracted, true,
            'retracted'
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
