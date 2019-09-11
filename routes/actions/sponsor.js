var readProject = require('../../data/read-project')
var writeRelicenseOrder = require('../../data/write-relicense-order')

exports.properties = {
  projectID: require('./common/project-id'),
  sponsor: require('./common/name'),
  jurisdiction: require('./common/jurisdiction'),
  email: require('./common/email')
}

exports.handler = function (log, body, end, fail, lock) {
  var projectID = body.projectID
  var sponsor = body.sponsor
  var jurisdiction = body.jurisdiction
  var email = body.email
  readProject(projectID, function (error, project) {
    if (error) return fail('no such project')
    if (project.retracted) return fail('project retracted')
    if (project.relicensed) return fail('project already relicensed')
    if (!project.pricing.relicense) return fail('not available for relicense')
    writeRelicenseOrder({
      project,
      sponsor,
      jurisdiction,
      email
    }, function (error, orderID) {
      if (error) return fail('internal error')
      end({ location: '/pay/' + orderID })
    })
  })
}
