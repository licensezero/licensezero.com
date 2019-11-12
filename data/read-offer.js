var annotateENOENT = require('./annotate-enoent')
var licensorPath = require('../paths/licensor')
var offerPath = require('../paths/offer')
var readJSONFile = require('./read-json-file')
var runWaterfall = require('run-waterfall')

module.exports = function (offerID, callback) {
  runWaterfall([
    function readProjectData (done) {
      var file = offerPath(offerID)
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
