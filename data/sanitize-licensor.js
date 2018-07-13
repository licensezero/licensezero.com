var WHITELIST = ['licensorID', 'name', 'jurisdiction', 'publicKey']

// Return data for a licensor that we can share publicly via the API.
module.exports = function (licensor) {
  Object.keys(licensor).forEach(function (key) {
    if (!WHITELIST.includes(key)) delete licensor[key]
  })
}
