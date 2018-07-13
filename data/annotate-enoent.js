// Set easy-to-check boolean properties on ENOENT errors.
module.exports = function (message, callback) {
  return function (error) {
    if (error && error.code === 'ENOENT') {
      error.userMessage = message
    }
    callback.apply(null, arguments)
  }
}
