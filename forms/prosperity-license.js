var path = require('path')

var VERSION = require('./prosperity-license/version.json')

var withCached = require('../data/with-cached')(
  path.join(
    __dirname, 'prosperity-license', 'LICENSE.md'
  )
)

module.exports = function (options, callback) {
  withCached(function (error, template) {
    if (error) return callback(error)
    var result = template
      .toString()
      .replace('$name', options.name)
      .replace('$address', options.homepage)
    callback(null, result)
  })
}

module.exports.version = VERSION
