var FormData = require('form-data')
var argon2 = require('argon2')
var encode = require('../data/encode')
var fs = require('fs')
var generateKeypair = require('../data/generate-keypair')
var html = require('../html')
var https = require('https')
var licensorPath = require('../paths/licensor')
var mkdirp = require('mkdirp')
var niceware = require('niceware')
var parseJSON = require('json-parse-errback')
var path = require('path')
var runWaterfall = require('run-waterfall')
var stripeNoncePath = require('../paths/stripe-nonce')
var uuid = require('uuid/v4')

module.exports = function (request, response, service) {
  if (request.method !== 'GET') {
    response.statusCode = 405
    response.end()
  } else {
    response.setHeader('Content-Type', 'text/html')
    var query = request.query
    if (query.error) {
      request.log.info({
        error: query.error,
        description: query.error_description
      }, 'connect error')
      response.end(html`
<!doctype html>
<html lang=en>
<head>
  <meta charset=UTF-8>
  <title>LicenseZero | Registration<title>
  <link rel=stylesheet href=/styles.css>
</head>
<body>
  <h1>Registration Rejected</h2>
  <p>
    You declined to connect a Stripe account to LicenseZero.
    You must connect a standard Stripe account to use LicenseZero.
  </p>
</body>
</html>
      `)
    } else if (
      query.scope === 'read_write' && query.code && query.state
    ) {
      var nonce = query.state
      var nonceFile = stripeNoncePath(service, nonce)
      fs.readFile(nonceFile, 'utf8', function (error, read) {
        if (error) {
          if (error.code === 'ENOENT') {
            response.statusCode = 400
            response.end()
          } else {
            response.statusCode = 500
            response.end()
          }
        } else {
          parseJSON(read, function (error, nonceData) {
            if (error) {
              response.statusCode = 500
              response.end()
            } else if (
              ['name', 'email', 'jurisdiction', 'timestamp']
                .some(function (key) {
                  return !isString(nonceData[key])
                })
            ) {
              request.log.error(nonceData, 'invalid stripe nonce file')
              response.statusCode = 500
              response.end()
            } else {
              var id = uuid()
              var licensorFile = licensorPath(service, id)
              var form = new FormData()
              form.append('client_secret', service.stripe.secret)
              form.append('code', query.code)
              form.append('grant_type', 'authorization_code')
              form.pipe(
                https.request({
                  method: 'POST',
                  host: 'connect.stripe.com',
                  path: '/oauth/token'
                })
                  .once('error', function (error) {
                    request.log.error(error)
                    response.statusCode = 500
                    response.end()
                  })
                  .once('response', function (response) {
                    parseJSON(response, function (error, stripe) {
                      if (error) {
                        request.log.error(error)
                        response.statusCode = 500
                        response.end()
                      } else if (stripe.error) {
                        request.log.error(stripe)
                        response.statusCode = 500
                        response.end()
                      } else if (
                        ['stripe_user_id', 'refresh_token']
                          .every(function (key) {
                            return !isString(stripe[key])
                          })
                      ) {
                        request.log.error(stripe)
                        response.statusCode = 500
                        response.end()
                      } else {
                        var keypair = generateKeypair()
                        var passphrase = niceware(16).join(' ')
                        runWaterfall([
                          mkdirp.bind(null, path.dirname(licensorFile)),
                          function hashPassphrase (done) {
                            argon2.hash(passphrase)
                              .catch(done)
                              .then(function (result) {
                                done(null, result)
                              })
                          },
                          function writeLicensorFile (done, hash) {
                            fs.writeFile(
                              licensorFile,
                              JSON.stringify({
                                name: nonceData.name,
                                email: nonceData.email,
                                jurisdiction: nonceData.jurisdiction,
                                registered: new Date().toISOString(),
                                password: hash,
                                keypair: {
                                  publicKey: encode(keypair.publicKey),
                                  privateKey: encode(keypair.privateKey)
                                },
                                stripe: {
                                  id: stripe.stripe_user_id,
                                  refresh: stripe.refresh_token
                                }
                              }),
                              done
                            )
                          }
                        ], function (error) {
                          if (error) {
                            response.statusCode = 500
                            response.end()
                          } else {
                            response.end(html`
<!doctype html>
<html lang=en>
<head>
  <meta charset=UTF-8>
  <title>LicenseZero | Registration<title>
  <link rel=stylesheet href=/styles.css>
</head>
<body>
  <h1>Registration Complete!</h2>
  <p>You've connected your Stripe account to LicenseZero.</p>
  <p>
    To offer licenses, install the
    <a href=https://www.npmjs.com/package/licensezero-cli
      ><code>licensezero</code> command line interface</a>
    and import your licensor credentials:
  </p>
  <pre><code>npm install licensezero
l0 authenticate "${id}" "${password}"</code></pre>
</body>
</html>
                            `)
                          }
                        })
                      }
                    })
                  })
              )
            }
          })
        }
      })
    } else {
      response.statusCode = 400
      response.end()
    }
  }
}

function isString (argument) {
  return typeof argument === 'string' && arugment.length !== 0
}
