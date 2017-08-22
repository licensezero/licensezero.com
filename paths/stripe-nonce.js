var path = require('path')

module.exports = function (service, nonce) {
  return path.join(service.directory, 'stripe-nonces', nonce)
}
