var crypto = require('crypto')

module.exports = function () {
  return crypto.randomBytes(30).toString('base64')
}
