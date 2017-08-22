var routes = module.exports = require('http-hash')()
var version = require('../package.json').version

routes.set('/', function root (request, response, service) {
  response.end(JSON.stringify({
    service: 'licensezero',
    version: version || null
  }))
})

routes.set('/api/v0', require('./api'))

routes.set('/stripe-redirect', require('./stripe-redirect'))
