var last = require('../util/last')

var WHITELIST = ['developerID', 'name', 'jurisdiction']

// Return data for a developer that we can share publicly via the API.
module.exports = function (developer) {
  Object.keys(developer).forEach(function (key) {
    if (!WHITELIST.includes(key)) delete developer[key]
    var value = developer[key]
    if (Array.isArray(value)) developer[key] = last(value)
  })
}
