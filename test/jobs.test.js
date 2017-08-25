var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var deleteExpiredOrders = require('../jobs/delete-expired-orders')
var ecb = require('ecb')
var fs = require('fs')
var http = require('http')
var mutateJSONFile = require('../data/mutate-json-file')
var ordersPath = require('../paths/orders')
var path = require('path')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestLicensor = require('./write-test-licensor')

tape('deleteExpiredOrders', function (test) {
  server(function (port, service, close) {
    var productID
    var location
    runSeries([
      writeTestLicensor.bind(null, service),
      function offerFirst (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }), ecb(done, function (response) {
          test.equal(response.error, false, 'error false')
          productID = response.product
          done()
        }))
      },
      function order (done) {
        apiRequest(port, {
          action: 'order',
          products: [productID],
          licensee: 'SomeCo, Inc.',
          jurisdiction: 'US-CA',
          tier: 'team'
        }, ecb(done, function (response) {
          test.equal(response.error, false, 'order error false')
          test.assert(
            response.location.indexOf('/pay/') === 0,
            'location'
          )
          location = response.location
          done()
        }))
      },
      function backdateOrder (done) {
        var directory = ordersPath(service)
        fs.readdir(directory, ecb(done, function (entries) {
          var file = path.join(directory, entries[0])
          mutateJSONFile(file, function (data) {
            var yesteryear = new Date()
            yesteryear.setFullYear(yesteryear.getFullYear() - 1)
            data.date = yesteryear
          }, done)
        }))
      },
      function tryToPayAfterBackdating (done) {
        http.get(
          'http://localhost:' + port + location,
          function (response) {
            test.equal(response.statusCode, 404)
            done()
          }
        )
      },
      function sweep (done) {
        deleteExpiredOrders(service, done)
      },
      function tryToPayAfterSweep (done) {
        http.get(
          'http://localhost:' + port + location,
          function (response) {
            test.equal(response.statusCode, 404)
            done()
          }
        )
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})
