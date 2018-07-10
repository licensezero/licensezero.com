var readSuspended = require('../../data/read-suspended')

exports.handler = function (log, body, end, fail, lock) {
  readSuspended(function (error, suspended) {
    if (error) {
      /* istanbul ignore else */
      if (error.userMessage) return fail(error.userMessage)
      log.error(error)
      return fail('internal error')
    }
    end({suspended: suspended})
  })
}
