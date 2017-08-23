var WHITELIST = ['id', 'name', 'jurisdiction', 'publicKey']

module.exports = function (licensor) {
  Object.keys(licensor).forEach(function (key) {
    if (!WHITELIST.includes(key)) {
      delete licensor[key]
    }
  })
}
