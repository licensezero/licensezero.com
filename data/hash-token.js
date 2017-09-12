var argon2 = require('argon2')

module.exports = function (token, callback) {
  argon2.hash(token)
    .catch(callback)
    .then(function (result) {
      callback(null, result)
    })
}
