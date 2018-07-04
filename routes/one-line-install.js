var INSTALL = require('../one-line-install.json')

module.exports = function (request, response, service) {
  response.end(INSTALL)
}
