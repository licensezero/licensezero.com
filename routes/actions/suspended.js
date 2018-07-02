var readSuspended = require('../../data/read-suspended')

exports.handler = function (body, service, end, fail, lock) {
  readSuspended(service, function (error, suspended) {
    if (error) {
      /* istanbul ignore else */
      if (error.userMessage) return fail(error.userMessage)
      service.log.error(error)
      return fail('internal error')
    }
    end({suspended: suspended})
  })
}
