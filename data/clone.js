// Clone data by round-tripping through JSON.
module.exports = function clone (argument) {
  return JSON.parse(JSON.stringify(argument))
}
