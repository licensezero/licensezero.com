var assert = require('assert')

module.exports = function (array) {
  assert(Array.isArray(array))
  return array[array.length - 1]
}
