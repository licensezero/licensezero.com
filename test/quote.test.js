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

tape('quote', function (test) {
  server(function (port, service, close) {
    var firstProduct
    var secondProduct
    runSeries([
      writeTestLicensor.bind(null, service),
      function offerFirst (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          id: LICENSOR.id,
          password: LICENSOR.password,
          repository: 'http://example.com/first',
          price: 2000
        }), ecb(done, function (response) {
          test.equal(response.error, false, 'error false')
          firstProduct = response.product
          done()
        }))
      },
      function offerSecond (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          id: LICENSOR.id,
          password: LICENSOR.password,
          repository: 'http://example.com/first',
          price: 3050,
          preorder: false
        }), ecb(done, function (response) {
          test.equal(response.error, false, 'error false')
          secondProduct = response.product
          done()
        }))
      },
      function quote (done) {
        apiRequest(port, {
          action: 'quote',
          products: [firstProduct, secondProduct]
        }, ecb(done, function (response) {
          test.equal(response.error, false, 'reoffer error false')
          test.deepEqual(
            response.products,
            [
              {
                product: firstProduct,
                price: 2000,
                term: 365,
                grace: 180,
                jurisdictions: ['US-CA'],
                preorder: true,
                licensor: {
                  name: 'Test User',
                  jurisdiction: 'US-CA'
                }
              },
              {
                product: secondProduct,
                price: 3050,
                term: 365,
                grace: 180,
                jurisdictions: ['US-CA'],
                preorder: false,
                licensor: {
                  name: 'Test User',
                  jurisdiction: 'US-CA'
                }
              }
            ],
            'quotes terms'
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
    var product
    runSeries([
      writeTestLicensor.bind(null, service),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          id: LICENSOR.id,
          password: LICENSOR.password
        }), ecb(done, function (response) {
          test.equal(response.error, false, 'error false')
          product = response.product
          done()
        }))
      },
      function retract (done) {
        apiRequest(port, {
          action: 'retract',
          product: product,
          id: LICENSOR.id,
          password: LICENSOR.password
        }, ecb(done, function (response) {
          test.equal(response.error, false, 'retract error false')
          done()
        }))
      },
      function quote (done) {
        apiRequest(port, {
          action: 'quote',
          products: [product]
        }, ecb(done, function (response) {
          test.deepEqual(response.products, [
            {
              product: product,
              retracted: true
            }
          ])
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
