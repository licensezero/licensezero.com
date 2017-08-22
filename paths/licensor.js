var path = require('path')

module.exports = function (service, id) {
  return path.join(service.directory, 'licensors', id, 'licensor')
}
