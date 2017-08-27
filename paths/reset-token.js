var path = require('path')

module.exports = function (service, token) {
  return path.join(service.directory, 'resets', token)
}
