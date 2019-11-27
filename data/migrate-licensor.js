var ARRAYS = ['jurisdiction', 'name', 'email']

module.exports = function (licensor) {
  ARRAYS.forEach(function (key, index) {
    var value = licensor[key]
    if (typeof value === 'string') licensor[key] = [value]
  })
  return licensor
}
