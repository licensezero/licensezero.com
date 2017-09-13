var email = require('./email')
var notFound = require('./routes/not-found')
var pinoHTTP = require('pino-http')
var routes = require('./routes')
var stripe = require('stripe')
var url = require('url')

module.exports = function makeRequestHandler (service, log) {
  var pino = pinoHTTP({logger: log})
  service.email = email(service, log)
  service.stripe.api = stripe(service.stripe.private)
  return function requestHandler (request, response) {
    pino(request, response)
    var parsed = url.parse(request.url, true)
    request.query = parsed.query
    request.pathname = parsed.pathname
    var route = routes.get(parsed.pathname)
    if (route.handler) {
      request.parameters = route.params
      route.handler(request, response, service)
    } else {
      notFound(service, response)
    }
  }
}
