var fs = require('fs')
var termsAcceptancesPath = require('../paths/terms-acceptances')

module.exports = function (service, record, callback) {
  fs.appendFile(
    termsAcceptancesPath(service),
    JSON.stringify(record),
    callback
  )
}
