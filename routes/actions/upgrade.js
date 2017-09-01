var parseJSON = require('json-parse-errback')
var readProduct = require('../../data/read-product')
var validLicense = require('../../data/valid-license')
var validManifest = require('../../data/valid-manifest')
var writeOrder = require('../../data/write-order')

var licenseProperties = {
  productID: require('./common/product-id'),
  manifest: {type: 'string'},
  document: {type: 'string'},
  publicKey: require('./common/public-key'),
  signature: require('./common/signature')
}

exports.properties = {
  license: {
    type: 'object',
    properties: licenseProperties,
    required: Object.keys(licenseProperties),
    additionalProperties: true
  },
  tier: require('./common/tier')
}

var MINIMUM_COST = 500

exports.handler = function (body, service, end, fail, lock) {
  var license = body.license
  var tier = body.tier
  if (!validLicense(license)) return fail('invalid license')
  parseJSON(license.manifest, function (error, manifest) {
    if (error || !validManifest(manifest)) {
      return fail('invalid license manifest')
    }
    var productID = manifest.product.productID
    readProduct(service, productID, function (error, product) {
      if (error) return fail(error.userMessage)
      if (product.retracted) return fail('retracted product')
      if (product.licensor.publicKey !== license.publicKey) {
        return fail('public key mismatch')
      }
      if (!product.pricing.hasOwnProperty(tier)) {
        return fail('not available for tier ' + tier)
      }
      product.price = Math.min(MINIMUM_COST, product.pricing[tier])
      delete product.pricing
      var pricedProducts = [product]
      writeOrder(
        service, pricedProducts, tier,
        manifest.licensee, manifest.jurisdiction,
        function (error, orderID) {
          if (error) return fail('internal error')
          else end({location: '/pay/' + orderID})
        }
      )
    })
  })
}
