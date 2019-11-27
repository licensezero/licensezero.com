var APPENDED_KEYS = ['jurisdiction', 'name', 'email']
var OLD_KEYS = ['oldJurisdictions', 'oldNames', 'oldEMails']

module.exports = function (licensor) {
  APPENDED_KEYS.forEach(function (key, index) {
    var OLD_KEY = OLD_KEYS[index]
    var value = licensor[key]
    if (typeof value === 'string') {
      value[OLD_KEY] = []
    } else if (Array.isArray(value)) {
      var currentValue = value[value.length - 1]
      var oldValues = value.slice(0, -1)
      licensor[key] = currentValue
      licensor[OLD_KEY] = oldValues
    } else {
      throw new Error('Invalid Value: ' + JSON.stringify(value))
    }
  })
  return licensor
}
