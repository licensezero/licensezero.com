var fs = require('fs')
var termsAcceptancesPath = require('../paths/terms-acceptances')

module.exports = function (record, callback) {
  fs.appendFile(
    termsAcceptancesPath(),
    JSON.stringify(record),
    callback
  )
}
