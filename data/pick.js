module.exports = function pick (object, keys) {
  var returned = {}
  keys.forEach(function (key) {
    returned[key] = object[key]
  })
  return returned
}
