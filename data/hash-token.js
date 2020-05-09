var argon2 = require('argon2')
var assert = require('assert')

module.exports = function (token, callback) {
  assert(typeof callback === 'function')
  argon2.hash(token)
    .catch(callback)
    .then(function (result) {
      callback(null, result)
    })
}
