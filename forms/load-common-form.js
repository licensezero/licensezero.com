var parse = require('commonform-commonmark').parse
var path = require('path')
var withCached = require('../data/with-cached')

module.exports = function (directory) {
  var BLANKS = require('./' + directory + '/blanks.json')
  var withMarkup = withCached(
    path.join(__dirname, directory, 'terms.md')
  )
  return function (/* [overrides,] callback */) {
    var overrides = {}
    var callback
    if (arguments.length === 1) {
      callback = arguments[0]
    } else {
      overrides = arguments[0]
      callback = arguments[1]
    }
    withMarkup(function (error, markup) {
      if (error) return callback(error)
      try {
        var parsed = parse(markup)
      } catch (error) {
        return callback(error)
      }
      var values = Object.assign({}, BLANKS, overrides)
      callback(null, {
        commonform: parsed.form,
        directions: parsed.directions.map(function (direction) {
          return {
            value: values[direction.label],
            blank: direction.blank
          }
        }),
        blanks: BLANKS
      })
    })
  }
}
