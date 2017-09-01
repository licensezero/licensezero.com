var TIERS = require('../../../data/private-license-tiers')

module.exports = {
  type: 'string',
  enum: Object.keys(TIERS)
}
