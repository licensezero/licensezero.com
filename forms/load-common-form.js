var fs = require('fs')
var parse = require('commonform-markup-parse')
var path = require('path')

module.exports = function (basename) {
  var BLANKS = require('./' + basename + '/blanks.json')
  return function (callback) {
    var file = path.join(__dirname, basename, basename + '.cform')
    fs.readFile(file, 'ascii', function (error, markup) {
      if (error) return callback(error)
      try {
        var parsed = parse(markup)
      } catch (error) {
        return callback(error)
      }
      callback(null, {
        commonform: parsed.form,
        directions: parsed.directions.map(function (direction) {
          return {
            value: BLANKS[direction.identifier],
            blank: direction.path
          }
        }),
        blanks: BLANKS
      })
    })
  }
}
