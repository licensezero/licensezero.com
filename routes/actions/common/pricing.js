var TIERS = require('../../../data/private-license-tiers')
var TIER_NAMES = Object.keys(TIERS)

var pricingSchema = module.exports = {
  description: 'private license pricing',
  type: 'object',
  properties: {},
  required: [],
  additionalProperties: false
}

TIER_NAMES.forEach(function (tier) {
  pricingSchema.properties[tier] = {
    description: 'price per license, in United States cents',
    type: 'integer',
    min: 300, // 3 dollars
    max: 100000 // 1,000 dollars
  }
  pricingSchema.required.push(tier)
})
