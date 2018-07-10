var path = require('path')

module.exports = function () {
  return path.join(process.env.DIRECTORY, 'terms.ndjson')
}
