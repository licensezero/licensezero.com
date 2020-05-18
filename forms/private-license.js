var commonmark = require('commonform-commonmark')
var path = require('path')

var withCached = require('../data/with-cached')(
  path.join(
    __dirname, 'private-license', 'terms.md'
  )
)

module.exports = function (callback) {
  withCached(function (error, markup) {
    if (error) return callback(error)
    var parsed
    try {
      parsed = commonmark.parse(markup)
    } catch (error) {
      return callback(error)
    }
    return callback(null, parsed)
  })
}
