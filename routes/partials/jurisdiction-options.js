var JURISDICTIONS = require('licensezero-jurisdictions')
var escape = require('../escape')
var html = require('../html')
var iso31662 = require('iso-3166-2')

module.exports = function () {
  return JURISDICTIONS.map(function (code) {
    var parsed = iso31662.subdivision(code)
    return html`
    <option value="${escape(code)}">
      ${escape(parsed.countryName)}:
      ${escape(parsed.name)}
    </option>
    `
  })
}
