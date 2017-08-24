var path = require('path')

module.exports = function (service) {
  return path.join(service.directory, 'accounts.tsv')
}
