var simpleGet = require('simple-get')

module.exports = function (request, response) {
  simpleGet.concat({
    url: 'https://github.com/licensezero/cli/releases/latest',
    json: true
  }, function (error, _, data) {
    if (error) {
      request.log.error(error)
      response.statusCode = 502
      response.end()
    }
    response.setHeader('Content-Type', 'application/json')
    response.end(data.tag_name)
  })
}
