var mustache = require('mustache')
var path = require('path')

var VERSION = require('./permissive-license/version.json')

var withCached = require('../data/with-cached')(
  path.join(
    __dirname, 'permissive-license', 'LICENSE.mustache'
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
        source: options.url
      }
    ))
  })
}

module.exports.version = VERSION
