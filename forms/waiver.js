var fs = require('fs')
var mustache = require('mustache')
var path = require('path')

var VERSION = require('./waiver/version.json')

var TEMPLATE = path.join(__dirname, 'waiver', 'WAIVER.mustache')

module.exports = function (options, callback) {
  fs.readFile(TEMPLATE, 'utf8', function (error, template) {
    if (error) return callback(error)
    callback(null, mustache.render(
      template,
      {
        version: VERSION,
        beneficiary: options.beneficiary,
        name: options.name,
        jurisdiction: options.jurisdiction,
        productID: options.productID,
        description: options.description,
        repository: options.repository,
        date: options.date,
        term: options.term === 'forever' ? false : options.term,
        agentName: 'Artless Devices LLC',
        agentWebsite: 'https://licensezero.com',
        agentJurisdiction: 'US-CA'
      }
    ))
  })
}

module.exports.version = VERSION
