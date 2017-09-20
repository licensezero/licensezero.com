var mutateJSONFile = require('../../data/mutate-json-file')
var projectPath = require('../../paths/project')
var readJSONFile = require('../../data/read-json-file')

exports.properties = {
  licensorID: require('./common/licensor-id'),
  token: {type: 'string'},
  projectID: require('./common/project-id'),
  pricing: require('./common/pricing')
}

exports.handler = function (body, service, end, fail, lock) {
  lock([body.licensorID, body.projectID], function (release) {
    var file = projectPath(service, body.projectID)
    readJSONFile(file, function (error, project) {
      if (error) return fail('no such project')
      if (project.retracted) return fail('retracted project')
      if (project.relicensed) return fail('relicensed project')
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
  })
}
