var lock = require('./lock')

// TODO: improve user error reporting from invoked actions

module.exports = function (service, action, payload, callback) {
  if (!action.validate(payload)) {
    var error = new Error('invalid body')
    return callback(error)
  }
  action.handler(
    payload,
    service,
    function end (response) {
      callback(null, response)
    },
    function fail (error) {
      callback(error)
    },
    lock
  )
}
