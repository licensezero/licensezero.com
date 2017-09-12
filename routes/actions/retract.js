var annotateENOENT = require('../../data/annotate-enoent')
var mutateJSONFile = require('../../data/mutate-json-file')
var mutateTextFile = require('../../data/mutate-text-file')
var parseProjects = require('../../data/parse-projects')
var projectPath = require('../../paths/project')
var projectsListPath = require('../../paths/projects-list')
var runSeries = require('run-series')
var stringifyProjects = require('../../data/stringify-projects')

exports.properties = {
  licensorID: require('./common/licensor-id'),
  token: {type: 'string'},
  projectID: require('./common/project-id')
}

exports.handler = function (body, service, end, fail, lock) {
  var licensorID = body.licensorID
  var projectID = body.projectID
  lock([licensorID, projectID], function (release) {
    runSeries([
      function markRetracted (done) {
        var file = projectPath(service, projectID)
        mutateJSONFile(file, function (data) {
          data.retracted = true
        }, annotateENOENT('no such project', done))
      },
      function removeFromProjectsList (done) {
        var file = projectsListPath(service, licensorID)
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
        service.log.error(error)
        /* istanbul ignore else */
        if (error.userMessage) {
          fail(error.userMessage)
        } else {
          fail('internal error')
        }
      } else {
        end()
      }
    }))
  })
}
