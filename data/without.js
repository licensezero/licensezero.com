var clone = require('./clone')

module.exports = function without (object, keys) {
  var returned = clone(object)
  keys.forEach(function (key) {
    delete returned[key]
  })
  return returned
}
