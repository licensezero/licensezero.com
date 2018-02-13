var price = require('./price')

module.exports = {
  description: 'private license pricing',
  type: 'object',
  properties: {
    private: price,
    relicense: price
  },
  required: ['private'],
  additionalProperties: false
}
