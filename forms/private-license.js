var TIERS = require('../data/private-license-tiers')
var mustache = require('mustache')
var path = require('path')

var VERSION = require('./private-licenses/version')

var withCached = require('./with-cached')(
  path.join(
    __dirname, 'private-licenses', 'LICENSE.mustache'
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
      productID: options.productID,
      description: options.description,
      repository: options.repository
    }
    view[options.tier] = true
    if (Number.isInteger(TIERS[options.tier])) {
      view.limit = TIERS[options.tier]
    }
    callback(null, mustache.render(template, view))
  })
}

module.exports.version = VERSION
