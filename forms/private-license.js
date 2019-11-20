var mustache = require('mustache')
var path = require('path')

var VERSION = require('./private-license/version')

var withCached = require('../data/with-cached')(
  path.join(
    __dirname, 'private-license', 'LICENSE.md'
  )
)

module.exports = function (options, callback) {
  withCached(function (error, template) {
    if (error) return callback(error)
    var view = {
      version: VERSION,
      date: options.date,
      licensorName: options.licensor.name,
      licensorJurisdiction: options.licensor.jurisdiction,
      agentName: 'Artless Devices LLC',
      agentJurisdiction: 'US-CA',
      agentWebsite: 'https://licensezero.com',
      licenseeName: options.licensee.name,
      licenseeJurisdiction: options.licensee.jurisdiction,
      licenseeEmail: options.licensee.email,
      projectID: options.projectID,
      description: options.description,
      repository: options.homepage
    }
    callback(null, mustache.render(template, view))
  })
}

module.exports.version = VERSION
