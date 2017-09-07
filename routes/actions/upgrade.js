var parseJSON = require('json-parse-errback')
var readProject = require('../../data/read-project')
var validLicense = require('../../data/valid-license')
var validManifest = require('../../data/valid-manifest')
var writeOrder = require('../../data/write-order')

var licenseProperties = {
  projectID: require('./common/project-id'),
  manifest: {type: 'string'},
  document: {type: 'string'},
  publicKey: require('./common/public-key'),
  signature: require('./common/signature')
}

exports.properties = {
  license: {
    type: 'object',
    properties: licenseProperties,
    required: Object.keys(licenseProperties),
    additionalProperties: true
  },
  tier: require('./common/tier')
}

var MINIMUM_COST = 500

exports.handler = function (body, service, end, fail, lock) {
  var license = body.license
  var tier = body.tier
  if (!validLicense(license)) return fail('invalid license')
  parseJSON(license.manifest, function (error, manifest) {
    if (error || !validManifest(manifest)) {
      return fail('invalid license manifest')
    }
    var projectID = manifest.project.projectID
    readProject(service, projectID, function (error, project) {
      if (error) return fail(error.userMessage)
      if (project.retracted) return fail('retracted project')
      if (project.licensor.publicKey !== license.publicKey) {
        return fail('public key mismatch')
      }
      if (!project.pricing.hasOwnProperty(tier)) {
        return fail('not available for tier ' + tier)
      }
      project.price = Math.min(MINIMUM_COST, project.pricing[tier])
      delete project.pricing
      var pricedProjects = [project]
      writeOrder(
        service, pricedProjects, tier,
        manifest.licensee, manifest.jurisdiction,
        function (error, orderID) {
          if (error) return fail('internal error')
          else end({location: '/pay/' + orderID})
        }
      )
    })
  })
}
