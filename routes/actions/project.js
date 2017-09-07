var readProject = require('../../data/read-project')
var sanitizeProject = require('../../data/sanitize-project')

exports.properties = {
  projectID: require('./common/project-id')
}

exports.handler = function (body, service, end, fail) {
  readProject(service, body.projectID, function (error, data) {
    if (error) {
      service.log.error(error)
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
