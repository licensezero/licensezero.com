var readProject = require('../../data/read-project')
var runParallel = require('run-parallel')
var writeOrder = require('../../data/write-order')

exports.properties = {
  licensee: require('./common/name'),
  jurisdiction: require('./common/jurisdiction'),
  projects: {
    type: 'array',
    minItems: 1,
    // TODO: Revisit buy projects limit
    maxItems: 100,
    items: require('./common/project-id')
  },
  tier: require('./common/tier')
}

exports.handler = function (body, service, end, fail, lock) {
  var projects = body.projects
  var tier = body.tier
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
        var noTier = projects.filter(function (project) {
          return !project.pricing.hasOwnProperty(tier)
        })
        if (noTier.length !== 0) {
          return fail(
            'not available for tier: ' +
            noTier.map(projectIDOf).join(', ')
          )
        }
        var pricedProjects = projects.map(function (project) {
          project.price = project.pricing[tier]
          delete project.pricing
          return project
        })
        writeOrder(
          service, pricedProjects, tier,
          body.licensee, body.jurisdiction,
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
