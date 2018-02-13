var readProject = require('../../data/read-project')
var runParallel = require('run-parallel')
var writeOrder = require('../../data/write-order')

exports.properties = {
  licensee: require('./common/name'),
  jurisdiction: require('./common/jurisdiction'),
  email: require('./common/email'),
  person: require('./common/person'),
  projects: {
    type: 'array',
    minItems: 1,
    // TODO: Revisit buy projects limit
    maxItems: 100,
    items: require('./common/project-id')
  }
}

exports.handler = function (body, service, end, fail, lock) {
  var projects = body.projects
  runParallel(
    projects.map(function (projectID, index) {
      return function (done) {
        readProject(service, projectID, function (error, project) {
          if (error) {
            if (error.userMessage) {
              error.userMessage += ': ' + projectID
            }
            done(error)
          }
          projects[index] = project
          done()
        })
      }
    }),
    function (error) {
      if (error) {
        /* istanbul ignore else */
        if (error.userMessage) {
          fail(error.userMessage)
        } else {
          service.log.error(error)
          fail('internal error')
        }
      } else {
        var retracted = projects.filter(function (project) {
          return project.retracted
        })
        if (retracted.length !== 0) {
          return fail(
            'retracted projects: ' +
            retracted.map(projectIDOf).join(', ')
          )
        }
        var relicensed = projects.filter(function (project) {
          return project.relicensed
        })
        if (relicensed.length !== 0) {
          return fail(
            'relicensed projects: ' +
            relicensed.map(projectIDOf).join(', ')
          )
        }
        var pricedProjects = projects.map(function (project) {
          project.price = project.pricing.private
          delete project.pricing
          return project
        })
        writeOrder(
          service, pricedProjects,
          body.licensee, body.jurisdiction, body.email,
          function (error, orderID) {
            if (error) return fail('internal error')
            else end({location: '/pay/' + orderID})
          }
        )
      }
    }
  )
}

function projectIDOf (argument) {
  return argument.projectID
}
