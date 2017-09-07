var mutateJSONFile = require('../../data/mutate-json-file')
var projectPath = require('../../paths/project')

exports.properties = {
  licensorID: require('./common/licensor-id'),
  password: {type: 'string'},
  projectID: require('./common/project-id'),
  pricing: require('./common/pricing')
}

exports.handler = function (body, service, end, fail, lock) {
  lock([body.licensorID, body.projectID], function (release) {
    var file = projectPath(service, body.projectID)
    mutateJSONFile(file, function (data) {
      data.pricing = body.pricing
    }, release(function (error) {
      if (error) {
        service.log.error(error)
        return fail('internal error')
      } else {
        end()
      }
    }))
  })
}
