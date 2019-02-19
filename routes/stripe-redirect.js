var accountsPath = require('../paths/accounts')
var ed25519 = require('../util/ed25519')
var email = require('../email')
var footer = require('./partials/footer')
var fs = require('fs')
var generateToken = require('../data/generate-token')
var hashToken = require('../data/hash-token')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var licensorPath = require('../paths/licensor')
var mkdirp = require('mkdirp')
var nav = require('./partials/nav')
var outline = require('outline-numbering')
var parseJSON = require('json-parse-errback')
var path = require('path')
var requestStripeCredentials = require('../stripe/request-credentials')
var runWaterfall = require('run-waterfall')
var stripANSI = require('strip-ansi')
var stripeNoncePath = require('../paths/stripe-nonce')
var terms = require('../forms/terms-of-service')
var toANSI = require('commonform-terminal')
var uuid = require('uuid/v4')

module.exports = function (request, response) {
  if (request.method !== 'GET') {
    response.statusCode = 405
    return response.end()
  }
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
${head('Registration')}
<body>
  ${nav()}
  ${header()}
  <main>
    <h1>Registration Rejected</h2>
    <p>
      You declined to connect a Stripe account to License Zero.
      You must connect a standard Stripe account to use License Zero.
    </p>
  </main>
  ${footer()}
</body>
</html>
      `)
  } else if (
    query.scope === 'read_write' && query.code && query.state
  ) {
    var nonce = query.state
    var nonceFile = stripeNoncePath(nonce)
    return runWaterfall([
      function readNonceFile (done) {
        fs.readFile(nonceFile, function (error, read) {
          if (error) {
            /* istanbul ignore else */
            if (error.code === 'ENOENT') {
              error.statusCode = 400
            } else {
              error.statusCode = 500
            }
          }
          done(error, read)
        })
      },
      function deleteNonceFile (read, done) {
        fs.unlink(nonceFile, function (error) {
          request.log.error(error)
          done(null, read)
        })
      },
      function parseNonceFile (buffer, done) {
        parseJSON(buffer, function (error, parsed) {
          done(error, parsed)
        })
      },
      function validateNonceFile (nonceData, done) {
        /* istanbul ignore else */
        if (
          ['name', 'email', 'jurisdiction', 'timestamp']
            .some(function (key) {
              return isNonEmptyString(nonceData[key])
            })
        ) {
          return done(null, nonceData)
        }
        var error = new Error('invalid nonce file')
        error.statusCode = 500
        done(error)
      },
      function (nonceData, done) {
        requestStripeCredentials(
          query.code,
          function (error, results) {
            /* istanbul ignore if */
            if (error) error.statusCode = 500
            done(error, results, nonceData)
          }
        )
      },
      function validateStripeBody (body, nonceData, done) {
        if (body.error) {
          request.log.error(body, 'stripe error')
          body.error.statusCode = 500
          return done(body.error)
        }
        if (
          !['stripe_user_id', 'refresh_token']
            .every(function (key) {
              return isNonEmptyString(body[key])
            })
        ) {
          request.log.error(body, 'invalid stripe body')
          var error = new Error('invalid stripe body')
          error.statusCode = 500
          return done(error)
        }
        done(null, body, nonceData)
      },
      function writeLicensorFile (stripeData, nonceData, done) {
        var licensorID = uuid()
        var licensorFile = licensorPath(licensorID)
        var keypair = ed25519.keys()
        var passphrase = generateToken()
        var stripeID = stripeData.stripe_user_id
        runWaterfall([
          mkdirp.bind(null, path.dirname(licensorFile)),
          function (_, done) {
            hashToken(passphrase, done)
          },
          function (hash, done) {
            fs.writeFile(
              licensorFile,
              JSON.stringify({
                licensorID: licensorID,
                name: nonceData.name,
                email: nonceData.email,
                jurisdiction: nonceData.jurisdiction,
                registered: new Date().toISOString(),
                token: hash,
                publicKey: keypair.publicKey,
                privateKey: keypair.privateKey,
                stripe: {
                  id: stripeID,
                  refresh: stripeData.refresh_token
                }
              }),
              done
            )
          }
        ], function (error) {
          if (error) return done(error)
          email(request.log, {
            to: 'registrations@artlessdevices.com',
            subject: 'Licensor Registration',
            text: [
              [
                'id: ' + licensorID,
                'name: ' + nonceData.name,
                'email: ' + nonceData.email,
                'jurisdiction: ' + nonceData.jurisdiction
              ].join('\n')
            ]
          }, function (error) {
            if (error) request.log.error(error)
          })
          done(
            null, nonceData.email, licensorID, stripeID,
            keypair.publicKey, passphrase
          )
        })
      },
      function emailLicensor (
        address, licensorID, stripeID, publicKey, passphrase, done
      ) {
        runWaterfall([
          terms,
          function (terms, done) {
            email(request.log, {
              to: address,
              subject: 'Licensor Registration',
              text: [
                [
                  'Thank you for registering as a licensor',
                  'though licensezero.com.'
                ].join('\n'),
                [
                  'Your unique licensor ID is:',
                  licensorID
                ].join('\n'),
                [
                  'License Zero will use the following',
                  'Ed25519 public key to sign licenses',
                  'sold on your behalf:'
                ].join('\n'),
                [
                  publicKey.slice(0, 32),
                  publicKey.slice(32)
                ].join('\n')
              ],
              terms: (
                'Terms of Service\n\n' +
                stripANSI(
                  toANSI(
                    terms.commonform,
                    terms.directions,
                    { numbering: outline }
                  )
                ).replace(/^ {4}/, '')
              )
            }, function (error) {
              if (error) return done(error)
              done(null, licensorID, stripeID, passphrase)
            })
          }
        ], done)
      },
      function appendToAccounts (
        licensorID, stripeID, passphrase, done
      ) {
        var file = accountsPath()
        var line = stripeID + '\t' + licensorID + '\n'
        fs.appendFile(file, line, function (error) {
          if (error) return done(error)
          request.log.info('appended to accounts')
          done(null, licensorID, passphrase)
        })
      }
    ], function (error, licensorID, passphrase) {
      if (error) {
        request.log.error(error)
        response.statusCode = error.statusCode || 500
        return response.end()
      }
      response.setHeader('Content-Type', 'text/html')
      response.end(html`
<!doctype html>
<html lang=en>
${head('Registration')}
<body>
${nav()}
${header()}
<main>
  <h1>Registration Complete</h2>
  <p>You've connected your Stripe account to LicenseZero.</p>
  <p>
    To offer licenses, install the
    <a href=https://github.com/licensezero/cli
      ><code>licensezero</code> command line interface</a>
    and import your licensor credentials:
  </p>
  <code class=terminal>licensezero token --licensor <span class=id>${licensorID}</span></code>
  <p>Then enter your access token: <code class=token>${passphrase}</code></p>
</main>
${footer()}
</body>
</html>
      `)
    })
  }
  response.statusCode = 400
  response.end()
}

function isNonEmptyString (argument) {
  return typeof argument === 'string' && argument.length !== 0
}
