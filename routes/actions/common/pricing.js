var TIERS = require('../../../data/private-license-tiers')
var TIER_NAMES = Object.keys(TIERS)

var pricingSchema = module.exports = {
  description: 'private license pricing',
  type: 'object',
  properties: {relicense: require('./price')},
  required: [],
  additionalProperties: false
}

TIER_NAMES.forEach(function (tier) {
  pricingSchema.properties[tier] = require('./price')
  pricingSchema.required.push(tier)
})
