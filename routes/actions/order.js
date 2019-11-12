var assert = require('assert')
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
    maxItems: 100,
    items: require('./common/project-id')
  }
}

exports.handler = function (log, body, end, fail, lock) {
  assert.strict.equal(typeof body, 'object')
  assert.strict.equal(typeof end, 'function')
  assert.strict.equal(typeof fail, 'function')
  assert.strict.equal(typeof lock, 'function')
  var projects = body.projects
  runParallel(
    projects.map(function (offerID, index) {
      return function (done) {
        readProject(offerID, function (error, project) {
          if (error) {
            if (error.userMessage) {
              error.userMessage += ': ' + offerID
            }
            return done(error)
          }
          projects[index] = project
          done()
        })
      }
    }),
    function (error) {
      if (error) {
        /* istanbul ignore else */
        if (error.userMessage) return fail(error.userMessage)
        log.error(error)
        return fail('internal error')
      }
      var retracted = projects.filter(function (project) {
        return project.retracted
      })
      if (retracted.length !== 0) {
        return fail(
          'retracted projects: ' +
          retracted.map(offerIDOf).join(', ')
        )
      }
      var relicensed = projects.filter(function (project) {
        return project.relicensed
      })
      if (relicensed.length !== 0) {
        return fail(
          'relicensed projects: ' +
          relicensed.map(offerIDOf).join(', ')
        )
      }
      var pricedProjects = projects.map(function (project) {
        project.price = project.pricing.private
        delete project.pricing
        return project
      })
      writeOrder({
        projects: pricedProjects,
        licensee: body.licensee,
        jurisdiction: body.jurisdiction,
        email: body.email
      }, function (error, orderID) {
        if (error) return fail('internal error')
        end({ location: '/pay/' + orderID })
      })
    }
  )
}

function offerIDOf (argument) {
  return argument.offerID
}
