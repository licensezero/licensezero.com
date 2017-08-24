var fs = require('fs')
var path = require('path')
var pump = require('pump')
var replacestream = require('replacestream')
var send = require('send')

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

routes.set('/pay/:order', require('./pay'))

routes.set('/terms', require('./terms'))

routes.set('/pay.js', function (request, response, service) {
  response.setHeader('Content-Type', 'application/javascript')
  pump(
    fs.createReadStream(
      path.join(__dirname, '..', 'static', 'pay.js')
    ),
    replacestream(
      'STRIPE_PUBLIC_KEY',
      JSON.stringify(service.stripe.public)
    ),
    response
  )
})

staticFile('styles.css')

function staticFile (file) {
  var filePath = path.join(__dirname, '..', 'static', file)
  routes.set('/' + file, function (request, response) {
    pump(send(request, filePath), response)
  })
}

routes.set('/robots.txt', function (request, response) {
  response.setHeader('Content-Type', 'text/plain')
  response.end([
    'User-Agent: *',
    'Disallow: /pay/'
  ].join('\n'))
})
