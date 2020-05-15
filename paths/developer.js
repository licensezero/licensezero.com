var developersPath = require('./developers')
var path = require('path')

module.exports = function (id) {
  return path.join(developersPath(), id, 'developer.json')
}
