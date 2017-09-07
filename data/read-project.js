var annotateENOENT = require('./annotate-enoent')
var licensorPath = require('../paths/licensor')
var projectPath = require('../paths/project')
var readJSONFile = require('./read-json-file')
var runWaterfall = require('run-waterfall')

module.exports = function (service, projectID, callback) {
  runWaterfall([
    function readProjectData (done) {
      var file = projectPath(service, projectID)
      readJSONFile(file, annotateENOENT('no such project', done))
    },
    function readLicensorData (project, done) {
      var file = licensorPath(service, project.licensor)
      readJSONFile(file, function (error, licensor) {
        if (error) return done(error)
        done(null, {
          licensor: licensor,
          project: project
        })
      })
    }
  ], function (error, results) {
    if (error) return callback(error)
    callback(null, Object.assign(results.project, {
      licensor: results.licensor
    }))
  })
}
