var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var ecb = require('ecb')
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
        id: LICENSOR.id
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
      id: LICENSOR.id
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
          id: LICENSOR.id,
          password: LICENSOR.password
        }), ecb(done, function (response) {
          product = response.product
          done()
        }))
      },
      function (done) {
        apiRequest(port, {
          action: 'licensor',
          id: LICENSOR.id
        }, ecb(done, function (response) {
          test.deepEqual(
            response.products, [product],
            'product listed'
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

tape('licensor w/ retracted product', function (test) {
  server(function (port, service, close) {
    var product
    runSeries([
      writeTestLicensor.bind(null, service),
      function offerProduct (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          id: LICENSOR.id,
          password: LICENSOR.password
        }), ecb(done, function (response) {
          product = response.product
          done()
        }))
      },
      function retractProduct (done) {
        apiRequest(port, {
          action: 'retract',
          id: LICENSOR.id,
          password: LICENSOR.password,
          product: product
        }, ecb(done, function (response) {
          test.equal(response.error, false, 'false error')
          done()
        }))
      },
      function listLicensorProducts (done) {
        apiRequest(port, {
          action: 'licensor',
          id: LICENSOR.id
        }, ecb(done, function (response) {
          test.deepEqual(
            response.products, [],
            'no product listed'
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

tape('licensor w/ retracted product', function (test) {
  server(function (port, service, close) {
    var firstProduct
    var secondProduct
    runSeries([
      writeTestLicensor.bind(null, service),
      function offerFirstProduct (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          id: LICENSOR.id,
          password: LICENSOR.password,
          repository: 'http://example.com/first'
        }), ecb(done, function (response) {
          test.equal(response.error, false, 'false error')
          firstProduct = response.product
          done()
        }))
      },
      function offerSecondProduct (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          id: LICENSOR.id,
          password: LICENSOR.password,
          repository: 'http://example.com/second'
        }), ecb(done, function (response) {
          test.equal(response.error, false, 'false error')
          secondProduct = response.product
          done()
        }))
      },
      function retractFirstProduct (done) {
        apiRequest(port, {
          action: 'retract',
          id: LICENSOR.id,
          password: LICENSOR.password,
          product: firstProduct
        }, ecb(done, function (response) {
          test.equal(response.error, false, 'false error')
          done()
        }))
      },
      function listLicensorProducts (done) {
        apiRequest(port, {
          action: 'licensor',
          id: LICENSOR.id
        }, ecb(done, function (response) {
          test.deepEqual(
            response.products, [secondProduct],
            'only unretracted product'
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
