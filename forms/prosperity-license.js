var mustache = require('mustache')
var path = require('path')

var VERSION = require('./prosperity-license/version.json')

var withCached = require('../data/with-cached')(
  path.join(
    __dirname, 'prosperity-license', 'LICENSE.mustache'
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
        source: options.url,
        gracePeriod: '32'
      }
    ))
  })
}

module.exports.version = VERSION
