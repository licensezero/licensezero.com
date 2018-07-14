var INSTALL = require('../content/one-line-install.json')

module.exports = function (request, response) {
  response.end(INSTALL)
}
