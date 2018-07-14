var lock = require('./lock')

module.exports = function (log, action, payload, callback) {
  if (!action.validate(payload)) {
    var error = new Error('invalid body')
    return callback(error)
  }
  action.handler(
    log,
    payload,
    function end (response) {
      callback(null, response)
    },
    function fail (error) {
      callback(error)
    },
    lock
  )
}
