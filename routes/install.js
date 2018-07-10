var INSTALL = 'https://raw.githubusercontent.com/licensezero/cli/master/install.sh'

module.exports = function (request, response) {
  response.setHeader('Location', INSTALL)
  response.statusCode = 302
  response.end()
}
