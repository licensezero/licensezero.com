var internalError = require('./routes/internal-error')
var notFound = require('./routes/not-found')
var parseURL = require('url-parse')
var pinoHTTP = require('pino-http')
var routes = require('./routes')

// Given a Pino log instance, return an argument suitable
// for `http.createSerever(handler)`.
module.exports = function makeRequestHandler (log) {
  var pino = pinoHTTP({ logger: log })
  return function requestHandler (request, response) {
    pino(request, response)
    var parsed = parseURL(request.url, true)
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
      internalError(request, response, error)
    }
  }
}
