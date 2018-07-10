var licensorsPath = require('./licensors')
var path = require('path')

module.exports = function (id) {
  return path.join(licensorsPath(), id, 'projects.ndjson')
}
