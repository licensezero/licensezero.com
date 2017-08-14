var routes = module.exports = require('http-hash')()
var version = require('../package.json').version

routes.set('/', function root (request, response, configuration) {
  response.end(JSON.stringify({
    service: 'licensezero',
    version: version || null
  }))
})
