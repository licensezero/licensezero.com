var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestLicensor = require('./write-test-licensor')

tape('licensor', function (test) {
  server(function (port, service, close) {
    writeTestLicensor(service, function (error) {
      test.error(error)
      apiRequest(port, {
        action: 'licensor',
        licensorID: LICENSOR.id
      }, function (error, response) {
        if (error) {
          test.error(error)
        } else {
          test.equal(
            response.error, false,
            'error false'
          )
          test.equal(
            response.name, LICENSOR.name,
            'name'
          )
          test.equal(
            response.jurisdiction, LICENSOR.jurisdiction,
            'jurisdiction'
          )
          test.assert(
            /^[0-9a-f]{64}$/.test(response.publicKey),
            'publicKey'
          )
          test.deepEqual(
            response.products, [],
            'products'
          )
        }
        test.end()
        close()
      })
    })
  })
})

tape('licensor w/ invalid id', function (test) {
  server(function (port, service, close) {
    apiRequest(port, {
      action: 'licensor',
      licensorID: LICENSOR.id
    }, function (error, response) {
      if (error) {
        test.error(error)
      } else {
        test.equal(
          response.error, 'no such licensor',
          'no such licensor'
        )
      }
      test.end()
      close()
    })
  })
})

tape('licensor w/ product', function (test) {
  server(function (port, service, close) {
    var product
    runSeries([
      writeTestLicensor.bind(null, service),
      function offerProduct (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }), function (error, response) {
          if (error) return done(error)
          product = response.product
          done()
        })
      },
      function (done) {
        apiRequest(port, {
          action: 'licensor',
          licensorID: LICENSOR.id
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.products.length, 1,
            'one product'
          )
          test.equal(
            response.products[0].product, product,
            'offered product'
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

tape('licensor w/ retracted product', function (test) {
  server(function (port, service, close) {
    var product
    runSeries([
      writeTestLicensor.bind(null, service),
      function offerProduct (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }), function (error, response) {
          if (error) return done(error)
          product = response.product
          done()
        })
      },
      function retractProduct (done) {
        apiRequest(port, {
          action: 'retract',
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          productID: product
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          done()
        })
      },
      function listLicensorProducts (done) {
        apiRequest(port, {
          action: 'licensor',
          licensorID: LICENSOR.id
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.products.length, 1,
            'one product listed'
          )
          test.notEqual(
            response.products[0].retracted, null,
            'product retracted'
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

tape('licensor w/ retracted product', function (test) {
  server(function (port, service, close) {
    var firstProduct
    var secondProduct
    runSeries([
      writeTestLicensor.bind(null, service),
      function offerFirstProduct (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          repository: 'http://example.com/first'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          firstProduct = response.product
          done()
        })
      },
      function offerSecondProduct (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          repository: 'http://example.com/second'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          secondProduct = response.product
          done()
        })
      },
      function retractFirstProduct (done) {
        apiRequest(port, {
          action: 'retract',
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          productID: firstProduct
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          done()
        })
      },
      function listLicensorProducts (done) {
        apiRequest(port, {
          action: 'licensor',
          licensorID: LICENSOR.id
        }, function (error, response) {
          if (error) return done(error)
          var products = response.products
          test.equal(
            products.length, 2,
            'two products'
          )
          test.notEqual(
            products
              .find(function (element) {
                return element.product === firstProduct
              })
              .retracted,
            null,
            'first product retracted'
          )
          test.equal(
            products
              .find(function (element) {
                return element.product === secondProduct
              })
              .retracted,
            null,
            'second product not retracted'
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
