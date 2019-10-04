var escape = require('../escape')
var iso31662 = require('iso-3166-2')

module.exports = function (code) {
  var data = iso31662.subdivision(code)
  return escape(data.name + ', ' + data.countryName)
}
