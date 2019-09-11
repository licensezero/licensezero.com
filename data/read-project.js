var annotateENOENT = require('./annotate-enoent')
var licensorPath = require('../paths/licensor')
var projectPath = require('../paths/project')
var readJSONFile = require('./read-json-file')
var runWaterfall = require('run-waterfall')

module.exports = function (projectID, callback) {
  runWaterfall([
    function readProjectData (done) {
      var file = projectPath(projectID)
      readJSONFile(file, annotateENOENT('no such project', done))
    },
    function readLicensorData (project, done) {
      var file = licensorPath(project.licensor)
      readJSONFile(file, function (error, licensor) {
        if (error) return done(error)
        done(null, { licensor, project })
      })
    }
  ], function (error, results) {
    if (error) return callback(error)
    callback(null, Object.assign(results.project, {
      licensor: results.licensor
    }))
  })
}
