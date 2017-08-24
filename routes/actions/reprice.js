var UUIDV4 = require('../../data/uuidv4-pattern')
var createSKUs = require('../../data/create-skus')
var readProduct = require('../../data/read-product')
var runParallel = require('run-parallel')
var runSeries = require('run-series')

exports.schema = {
  properties: {
    id: {
      description: 'licensor id',
      type: 'string',
      pattern: UUIDV4
    },
    password: {
      type: 'string'
    },
    product: require('./retract').schema.properties.product,
    pricing: require('./offer').schema.properties.pricing
  }
}

exports.handler = function (body, service, end, fail, lock) {
  lock([body.id, body.product], function (release) {
    readProduct(service, body.product, function (error, product) {
      if (error) {
        service.log.error(error)
        release()
        return fail('internal error')
      }
      runSeries([
        function deactivateOldSKUs (done) {
          runParallel(product.stripe.skus.data.map(function (sku) {
            return function (done) {
              service.stripe.api.skus.update(
                sku.id, {active: false}, done
              )
            }
          }), done)
        },
        function createNewSKUs (done) {
          createSKUs(
            service, body.id, body.product,
            product.stripe.id, body.pricing,
            done
          )
        }
      ], function (error) {
        if (error) {
          fail('internal error')
        } else {
          end()
        }
      })
    })
  })
}
