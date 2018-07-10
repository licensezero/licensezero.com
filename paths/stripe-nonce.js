var path = require('path')

module.exports = function (nonce) {
  return path.join(process.env.DIRECTORY, 'stripe-nonces', nonce + '.json')
}
