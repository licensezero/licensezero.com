var ARRAYS = ['jurisdiction', 'name', 'email']

module.exports = function (developer) {
  ARRAYS.forEach(function (key, index) {
    var value = developer[key]
    if (typeof value === 'string') developer[key] = [value]
  })
  return developer
}
