module.exports = function without (object, keys) {
  var clone = JSON.parse(JSON.stringify(object))
  keys.forEach(function (key) {
    delete clone[key]
  })
  return clone
}
