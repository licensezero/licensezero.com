var TIERS = require('./private-license-tiers')
var ecb = require('ecb')
var runParallel = require('run-parallel')

var TIER_NAMES = Object.keys(TIERS)

module.exports = function (
  service, licensorID, productID, stripeID, pricing, callback
) {
  var now = new Date().toISOString()
  var results = {}
  runParallel(TIER_NAMES.map(function (tierName) {
    return function createSKU (done) {
      service.stripe.api.skus.create({
        product: stripeID,
        attributes: {
          tier: tierName,
          users: TIERS[tierName]
        },
        price: pricing[tierName],
        currency: 'usd',
        inventory: {type: 'infinite'},
        metadata: {
          tier: tierName,
          licensor: licensorID,
          product: productID,
          date: now
        }
      }, ecb(done, function (response) {
        results[tierName] = response.id
        done()
      }))
    }
  }), ecb(callback, function () {
    callback(null, results)
  }))
}
