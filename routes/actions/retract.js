var annotateENOENT = require('../../data/annotate-enoent')
var mutateJSONFile = require('../../data/mutate-json-file')
var mutateTextFile = require('../../data/mutate-text-file')
var parseProjects = require('../../data/parse-projects')
var projectPath = require('../../paths/project')
var projectsListPath = require('../../paths/projects-list')
var readJSONFile = require('../../data/read-json-file')
var runSeries = require('run-series')
var stringifyProjects = require('../../data/stringify-projects')

exports.properties = {
  licensorID: require('./common/licensor-id'),
  token: { type: 'string' },
  projectID: require('./common/project-id')
}

exports.handler = function (log, body, end, fail, lock) {
  var licensorID = body.licensorID
  var projectID = body.projectID
  lock([licensorID, projectID], function (release) {
    var file = projectPath(body.projectID)
    readJSONFile(file, function (error, project) {
      if (error) return die('no such project')
      if (project.retracted) return die('retracted project')
      if (project.relicensed) return die('relicensed project')
      if (project.lock) {
        var unlockDate = new Date(project.lock.unlock)
        var now = new Date()
        if (unlockDate > now) return die('locked project')
      }
      runSeries([
        function markRetracted (done) {
          var file = projectPath(projectID)
          mutateJSONFile(file, function (data) {
            data.retracted = true
          }, annotateENOENT('no such project', done))
        },
        function removeFromProjectsList (done) {
          var file = projectsListPath(licensorID)
          mutateTextFile(file, function (text) {
            return stringifyProjects(
              parseProjects(text)
                .map(function (element) {
                  if (
                    element.projectID === projectID &&
                    element.retracted === null
                  ) {
                    element.retracted = new Date().toISOString()
                  }
                  return element
                })
            )
          }, done)
        }
      ], release(function (error) {
        if (error) {
          log.error(error)
          /* istanbul ignore else */
          if (error.userMessage) return fail(error.userMessage)
          return fail('internal error')
        }
        end()
      }))
    })
    function die (message) {
      release(function () {
        fail(message)
      })()
    }
  })
}
