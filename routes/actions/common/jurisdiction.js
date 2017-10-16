var JURISDICTIONS = require('licensezero-jurisdictions')

module.exports = {
  description: 'legal jurisdiction where you reside',
  type: 'string',
  enum: JURISDICTIONS
}
