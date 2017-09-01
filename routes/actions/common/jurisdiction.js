var JURISDICTIONS = require('../../../data/jurisdictions')

module.exports = {
  description: 'legal jurisdiction where you reside',
  type: 'string',
  enum: JURISDICTIONS
}
