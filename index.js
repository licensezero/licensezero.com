var internalError = require('./routes/internal-error')
var notFound = require('./routes/not-found')
var pinoHTTP = require('pino-http')
var routes = require('./routes')
var url = require('url')

module.exports = function makeRequestHandler (log) {
  var pino = pinoHTTP({logger: log})
  return function requestHandler (request, response) {
    pino(request, response)
    var parsed = url.parse(request.url, true)
    request.query = parsed.query
    request.pathname = parsed.pathname
    try {
      var route = routes.get(parsed.pathname)
      if (route.handler) {
        request.parameters = route.params
        return route.handler(request, response)
      }
      notFound(request, response)
    } catch (error) {
      internalError(response, error)
    }
  }
}
