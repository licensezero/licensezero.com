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
      if (error.userMessage) {
        fail(error.userMessage)
      } else {
        fail('internal error')
      }
    } else {
      sanitizeProject(data)
      end(data)
    }
  })
}
