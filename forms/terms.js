var ecb = require('ecb')
var fs = require('fs')
var parse = require('commonform-markup-parse')
var path = require('path')

var BLANKS = require('./terms.blanks.json')

module.exports = function (callback) {
  var file = path.join(__dirname, 'terms.cform')
  fs.readFile(file, 'ascii', ecb(callback, function (markup) {
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
  }))
}
