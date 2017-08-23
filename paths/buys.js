var path = require('path')

module.exports = function (service, uuid) {
  return path.join(service.directory, 'buys')
}
