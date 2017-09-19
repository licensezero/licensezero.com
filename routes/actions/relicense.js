var readProject = require('../../data/read-project')
var writeRelicenseOrder = require('../../data/write-relicense-order')

exports.properties = {
  projectID: require('./common/project-id'),
  sponsor: require('./common/name'),
  jurisdiction: require('./common/jurisdiction')
}

exports.handler = function (body, service, end, fail, lock) {
  var projectID = body.projectID
  var sponsor = body.sponsor
  var jurisdiction = body.jurisdiction
  readProject(service, projectID, function (error, project) {
    if (error) return fail('no such project')
    if (project.retracted) return fail('project retracted')
    if (project.relicensed) return fail('project already relicensed')
    if (!project.pricing.relicense) return fail('not available for relicense')
    writeRelicenseOrder(service, {
      projectID: projectID,
      sponsor: sponsor,
      jurisdiction: jurisdiction,
      price: project.pricing.relicense
    }, function (error, orderID) {
      if (error) return fail('internal error')
      else end({location: '/pay/' + orderID})
    })
  })
}
