var licensorsPath = require('./licensors')
var path = require('path')

module.exports = function (service, id) {
  return path.join(licensorsPath(service), id, 'projects.ndjson')
}
