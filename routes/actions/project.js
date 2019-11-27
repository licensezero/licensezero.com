var last = require('../../util/last')
var readProject = require('../../data/read-project')
var sanitizeProject = require('../../data/sanitize-project')

exports.properties = {
  projectID: require('./common/project-id')
}

exports.handler = function (log, body, end, fail) {
  readProject(body.projectID, function (error, data) {
    if (error) {
      log.error(error)
      /* istanbul ignore else */
      if (error.userMessage) return fail(error.userMessage)
      return fail('internal error')
    }
    sanitizeProject(data)
    end(data)
  })
}
