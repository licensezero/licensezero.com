var fs = require('fs')
var mustache = require('mustache')
var path = require('path')

var VERSION = require('./public-license/version.json')

var TEMPLATE = path.join(
  __dirname, 'public-license', 'LICENSE.mustache'
)

module.exports = function (options, callback) {
  fs.readFile(TEMPLATE, 'utf8', function (error, template) {
    if (error) return callback(error)
    callback(null, mustache.render(
      template,
      {
        version: VERSION,
        name: options.name,
        jurisdiction: options.jurisdiction,
        firstHalfOfKey: options.publicKey.slice(0, 32),
        secondHalfOfKey: options.publicKey.slice(32),
        grace: options.grace.toString(),
        productID: options.productID,
        licensorID: options.licensorID,
        agentName: 'Artless Devices LLC',
        agentWebsite: 'https://licensezero.com'
      }
    ))
  })
}

module.exports.version = VERSION
