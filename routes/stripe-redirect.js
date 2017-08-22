var FormData = require('form-data')
var argon2 = require('argon2')
var ecb = require('ecb')
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
var simpleConcat = require('simple-concat')
var stripeNoncePath = require('../paths/stripe-nonce')
var uuid = require('uuid/v4')

module.exports = function (request, response, service) {
  if (request.method !== 'GET') {
    response.statusCode = 405
    response.end()
  } else {
    var query = request.query
    if (query.error) {
      request.log.info({
        error: query.error,
        description: query.error_description
      }, 'connect error')
      response.setHeader('Content-Type', 'text/html')
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
      runWaterfall([
        function readNonceFile (done) {
          fs.readFile(nonceFile, function (error, read) {
            if (error.code === 'ENOENT') {
              error.statusCode = 404
            } else {
              error.statusCode = 500
            }
            done(error, read)
          })
        },
        function deleteNonceFile (done, read) {
          fs.unlink(nonceFile, ecb(done, function (error) {
            done(null, read)
          }))
        },
        function parseNonceFile (buffer, done) {
          parseJSON(buffer, function (error, parsed) {
            if (error) {
              error.statusCode = 400
            }
            done(error, parsed)
          })
        },
        function validateNonceFile (nonceData, done) {
          if (
            ['name', 'email', 'jurisdiction', 'timestamp']
              .some(function (key) {
                return isString(nonceData[key])
              })
          ) {
            done(null, nonceData)
          } else {
            var error = new Error('invalid nonce file')
            error.statusCode = 500
            done(error)
          }
        },
        function requestStripeCredentials (nonceData, done) {
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
                simpleConcat(response, ecb(done, function (buffer) {
                  parseJSON(buffer, ecb(done, function (parsed) {
                    done(null, parsed, nonceData)
                  }))
                }))
              })
          )
        },
        function validateStripeBody (body, nonceData, done) {
          if (body.error) {
            request.log.error(body, 'stripe error')
            body.error.statusCode = 500
            done(body.error)
          } else if (
            ['stripe_user_id', 'refresh_token']
              .every(function (key) {
                return isString(body[key])
              })
          ) {
            request.log.error(body, 'invalid stripe body')
            var error = new Error('invalid stripe body')
            error.statusCode = 500
            done(error)
          } else {
            done(null, body, nonceData)
          }
        },
        function writeLicensorFile (stripeData, nonceData, done) {
          var id = uuid()
          var licensorFile = licensorPath(service, id)
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
                    id: stripeData.stripe_user_id,
                    refresh: stripeData.refresh_token
                  }
                }),
                done
              )
            }
          ], ecb(done, function () {
            done(null, id, passphrase)
          }))
        }
      ], function (error) {
        if (error) {
          response.statusCode = error.statusCode || 500
          response.end()
        } else {
          response.setHeader('Content-Type', 'text/html')
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
    } else {
      response.statusCode = 400
      response.end()
    }
  }
}

function isString (argument) {
  return typeof argument === 'string' && arugment.length !== 0
}
