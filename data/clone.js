module.exports = function clone (argument) {
  return JSON.parse(JSON.stringify(argument))
}
