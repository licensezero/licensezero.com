var mustache = require('mustache')
var path = require('path')

var VERSION = require('./waiver/version.json')

var withCached = require('../data/with-cached')(
  path.join(__dirname, 'waiver', 'WAIVER.mustache')
)

module.exports = function (options, callback) {
  withCached(function (error, template) {
    if (error) return callback(error)
    var developer = options.developer
    var beneficiary = options.beneficiary
    var offer = options.offer
    callback(null, mustache.render(
      template,
      {
        version: VERSION,
        beneficiary: beneficiary.name,
        beneficiaryJurisdiction: beneficiary.jurisdiction,
        licensor: developer.name,
        licensorJurisdiction: developer.jurisdiction,
        agent: 'Artless Devices LLC',
        agentJurisdiction: 'US-CA',
        agentWebsite: 'https://licensezero.com',
        offerID: offer.offerID,
        description: offer.description,
        homepage: offer.homepage,
        date: options.date,
        term: options.term.toLowerCase() === 'forever'
          ? false
          : options.term
      }
    ))
  })
}

module.exports.version = VERSION
