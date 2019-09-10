var fs = require('fs')
var path = require('path')
var pump = require('pump')
var send = require('send')

var routes = module.exports = require('http-hash')()

routes.set('/', require('./homepage'))
routes.set('/thanks', require('./thanks'))
routes.set('/pricing', require('./pricing'))
routes.set('/commitment', require('./commitment'))
routes.set('/manifesto', require('./manifesto'))
routes.set('/projects/:projectID', function (request, response) {
  response.statusCode = 301
  response.setHeader(
    'Location',
    '/ids/' + request.parameters.projectID
  )
  response.end()
})
routes.set('/projects/:projectID/badge.svg', function (request, response) {
  response.statusCode = 301
  response.setHeader(
    'Location',
    '/ids/' + request.parameters.projectID + '/badge.svg'
  )
  response.end()
})
routes.set('/ids/:projectID', require('./id'))
routes.set('/ids/:projectID/badge.svg', require('./badge'))
routes.set('/buy', require('./buy'))
routes.set('/purchases/:purchaseID', require('./purchases'))
routes.set('/api/v0', require('./api'))

routes.set('/licenses', require('./licenses'))
routes.set('/licenses/private', require('./private-license'))
routes.set('/licenses/public', function (request, response) {
  redirect303(response, '/licenses/noncommercial')
})
routes.set('/licenses/noncommercial', require('./noncommercial-license'))
routes.set('/licenses/reciprocal', require('./reciprocal-license'))
routes.set('/licenses/parity', require('./parity-license'))
routes.set('/licenses/parity/:version', function (request, response) {
  var version = request.parameters.version
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    response.statusCode = 400
    response.end()
    return
  }
  var filePath = path.join(__dirname, '..', 'static', `parity-${version}.txt`)
  pump(send(request, filePath), response)
})
routes.set('/licenses/charity', require('./charity-license'))
routes.set('/licenses/prosperity', require('./prosperity-license'))
routes.set('/licenses/permissive', require('./permissive-license'))
routes.set('/licenses/waiver', require('./waiver'))
routes.set('/licenses/relicense', require('./relicense'))

routes.set('/install.sh', require('./install'))
routes.set('/one-line-install.sh', require('./one-line-install'))
routes.set('/cli-version', require('./cli-version'))

function redirect303 (response, location) {
  response.statusCode = 303
  response.setHeader('Location', location)
  response.end()
}

routes.set('/stripe-redirect', require('./stripe-redirect'))
routes.set('/stripe-webhook', require('./stripe-webhook'))

routes.set('/pay/:order', require('./pay'))
routes.set('/reset/:token', require('./reset'))

routes.set('/terms', require('./terms'))
routes.set('/terms/service', require('./terms-of-service'))
routes.set('/terms/agency', require('./agency-terms'))

routes.set('/privacy', require('./privacy'))

routes.set('/pay.js', function (request, response) {
  response.setHeader('Content-Type', 'application/javascript')
  var value = JSON.stringify(process.env.STRIPE_PUBLISHABLE_KEY)
  response.write(`window.STRIPE_PUBLISHABLE_KEY = ${value};\n`)
  pump(
    fs.createReadStream(
      path.join(__dirname, '..', 'static', 'pay.js')
    ),
    response
  )
})

routes.set('/clipboard.min.js', function (request, response) {
  response.setHeader('Content-Type', 'application/javascript')
  pump(
    fs.createReadStream(
      path.join(__dirname, '..', 'static', 'clipboard.min.js')
    ),
    response
  )
})

staticFile('normalize.css')
staticFile('styles.css')
staticFile('logo-100.png')
staticFile('logo-on-white-100.png')
staticFile('logo.svg')
staticFile('vending-machine.svg')
staticFile('out-of-order.svg')
staticFile('licensee.gif')
staticFile('doors.svg')
staticFile('credits.txt')

// Showcase Logos
staticFile('caravaggio.jpg')
staticFile('statiq.png')

function staticFile (file) {
  var filePath = path.join(__dirname, '..', 'static', file)
  routes.set('/' + file, function (request, response) {
    pump(send(request, filePath), response)
  })
}

quoteTemplate('waiver')
quoteTemplate('relicense')

function quoteTemplate (type) {
  var filePath = path.join(
    __dirname, '..', 'forms',
    'quotes', 'quote-for-' + type + '.odt'
  )
  routes.set('/licenses/quotes/' + type + '.odt', function (request, response) {
    pump(send(request, filePath), response)
  })
}

routes.set('/robots.txt', function (request, response) {
  response.setHeader('Content-Type', 'text/plain')
  response.end([
    'User-Agent: *',
    'Disallow: /pay/',
    'Disallow: /reset/',
    'Disallow: /purchases/'
  ].join('\n'))
})

routes.set('/.well-known/security.txt', function (request, response) {
  response.setHeader('Content-Type', 'text/plain')
  response.end([
    'Contact: mailto:security@artlessdevices.com',
    'Encryption: https://licensezero.com/security-pgp-key.txt',
    'Acknowledgments: https://licensezero.com/thanks',
    'Preferred-Languages: en',
    'Canonical: https://licensezero.com/.well-known/security.txt'
  ].join('\n'))
})

routes.set('/security-pgp-key.txt', function (request, response) {
  response.setHeader('Content-Type', 'text/plain')
  response.end([
    '-----BEGIN PGP PUBLIC KEY BLOCK-----',
    '',
    'mDMEXGRQIxYJKwYBBAHaRw8BAQdANVewWyxTxdu1nS6eFfujeuZSUxMpqzu4TBQ4',
    'PumZAxu0MUFydGxlc3MgRGV2aWNlcyBMTEMgPHNlY3VyaXR5QGFydGxlc3NkZXZp',
    'Y2VzLmNvbT6IkAQTFggAOBYhBHbWQt0ULsRlbvPV/GPoU0xsyIQ/BQJcZFAjAhsD',
    'BQsJCAcCBhUICQoLAgQWAgMBAh4BAheAAAoJEGPoU0xsyIQ/7qMA/jaJ9ld3kmr2',
    'tq9ULrtX9eEOeH9FNO3Wo72v05LA1LgJAP0QgICtgRgxHPEVVyQIbrrbfPKn/RaH',
    '3hASRhlZ87KuDrg4BFxkUCMSCisGAQQBl1UBBQEBB0B1FinTm4TN6IPsu0oLWRgo',
    '924qAijNuygtFgVsKuz+DAMBCAeIeAQYFggAIBYhBHbWQt0ULsRlbvPV/GPoU0xs',
    'yIQ/BQJcZFAjAhsMAAoJEGPoU0xsyIQ/Ct0A/in5UeF8036pKZO9rfwiIC9gPHQ9',
    'D4vRHmnBR4todrhfAQCWhBpJ978bZReFEn9ODdSDYX4xZ8FVNKohDH3KCOxWDA==',
    '=3xMP',
    '-----END PGP PUBLIC KEY BLOCK-----'
  ].join('\n'))
})

var internalError = require('./internal-error')
routes.set('/500', function (request, response) {
  internalError(response, new Error('Error for test purposes.'))
})
