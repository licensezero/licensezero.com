var licensorPath = require('../../paths/licensor')
var listProjects = require('../../data/list-projects')
var readJSONFile = require('../../data/read-json-file')

exports.properties = {
  licensorID: require('./common/licensor-id')
}

exports.handler = function (log, body, end, fail) {
  var licensorID = body.licensorID
  var file = licensorPath(licensorID)
  readJSONFile(file, function (error, licensor) {
    if (error) {
      /* istanbul ignore else */
      if (error.code === 'ENOENT') return fail('no such licensor')
      return fail('internal error')
    }
    listProjects(licensorID, function (error, projects) {
      /* istanbul ignore if */
      if (error) {
        log.error(error)
        return fail('internal error')
      }
      end({
        name: licensor.name,
        jurisdiction: licensor.jurisdiction,
        publicKey: licensor.publicKey,
        projects
      })
    })
  })
}
