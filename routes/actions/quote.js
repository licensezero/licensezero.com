var readProject = require('../../data/read-project')
var runParallel = require('run-parallel')
var sanitizeProject = require('../../data/sanitize-project')

exports.properties = {
  projects: {
    type: 'array',
    minItems: 1,
    // TODO: Revisit quote projects limit
    maxItems: 100,
    items: require('./common/project-id')
  }
}

exports.handler = function (log, body, end, fail, lock) {
  var projects = body.projects
  var results = new Array(projects.length)
  runParallel(
    projects.map(function (projectID, index) {
      return function (done) {
        readProject(projectID, function (error, project) {
          if (error) {
            if (error.userMessage) {
              error.userMessage += ': ' + projectID
            }
            done(error)
          } else {
            sanitizeProject(project)
            results[index] = project
            done()
          }
        })
      }
    }),
    function (error) {
      if (error) {
        /* istanbul ignore else */
        if (error.userMessage) {
          fail(error.userMessage)
        } else {
          fail('internal error')
        }
      } else {
        end({projects: results})
      }
    }
  )
}
