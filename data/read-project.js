var annotateENOENT = require('./annotate-enoent')
var projectPath = require('../paths/project')
var readJSONFile = require('./read-json-file')
var readLicensor = require('./read-licensor')
var runWaterfall = require('run-waterfall')

module.exports = function (projectID, callback) {
  runWaterfall([
    function readProjectData (done) {
      var file = projectPath(projectID)
      readJSONFile(file, annotateENOENT('no such project', done))
    },
    function readLicensorData (project, done) {
      readLicensor(project.licensor, function (error, licensor) {
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
