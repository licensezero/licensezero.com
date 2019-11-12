var readOffer = require('../../data/read-offer')
var runParallel = require('run-parallel')
var sanitizeOffer = require('../../data/sanitize-offer')

exports.properties = {
  projects: {
    type: 'array',
    minItems: 1,
    maxItems: 100,
    items: require('./common/offer-id')
  }
}

exports.handler = function (log, body, end, fail, lock) {
  var projects = body.projects
  var results = new Array(projects.length)
  runParallel(
    projects.map(function (offerID, index) {
      return function (done) {
        readOffer(offerID, function (error, project) {
          if (error) {
            if (error.userMessage) {
              error.userMessage += ': ' + offerID
            }
            return done(error)
          }
          sanitizeOffer(project)
          results[index] = project
          done()
        })
      }
    }),
    function (error) {
      if (error) {
        /* istanbul ignore else */
        if (error.userMessage) return fail(error.userMessage)
        return fail('internal error')
      }
      end({ projects: results })
    }
  )
}
