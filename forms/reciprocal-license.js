var mustache = require('mustache')
var path = require('path')

var VERSION = require('./reciprocal-license/version')

var withCached = require('./with-cached')(
  path.join(
    __dirname, 'reciprocal-license', 'LICENSE.mustache'
  )
)

module.exports = function (options, callback) {
  withCached(function (error, template) {
    if (error) return callback(error)
    callback(null, mustache.render(
      template,
      {
        version: VERSION,
        name: options.name,
        jurisdiction: options.jurisdiction,
        firstHalfOfKey: options.publicKey.slice(0, 32),
        secondHalfOfKey: options.publicKey.slice(32),
        projectID: options.projectID,
        agentName: 'Artless Devices LLC',
        agentWebsite: 'https://licensezero.com'
      }
    ))
  })
}

module.exports.version = VERSION
