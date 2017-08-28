var argon2 = require('argon2')

module.exports = function (password, callback) {
  argon2.hash(password)
    .catch(callback)
    .then(function (result) {
      callback(null, result)
    })
}
