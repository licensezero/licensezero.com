var mustache = require('mustache')
var path = require('path')

var VERSION = require('./waiver/version.json')

var withCached = require('./with-cached')(
  path.join(__dirname, 'waiver', 'WAIVER.mustache')
)

module.exports = function (options, callback) {
  withCached(function (error, template) {
    if (error) return callback(error)
    var licensor = options.licensor
    var beneficiary = options.beneficiary
    var project = options.project
    callback(null, mustache.render(
      template,
      {
        version: VERSION,
        beneficiaryName: beneficiary.name,
        beneficiaryJurisdiction: beneficiary.jurisdiction,
        licensorName: licensor.name,
        licensorJurisdiction: licensor.jurisdiction,
        agentName: 'Artless Devices LLC',
        agentJurisdiction: 'US-CA',
        agentWebsite: 'https://licensezero.com',
        projectID: project.projectID,
        description: project.description,
        repository: project.repository,
        date: options.date,
        term: options.term === 'forever' ? false : options.term
      }
    ))
  })
}

module.exports.version = VERSION
