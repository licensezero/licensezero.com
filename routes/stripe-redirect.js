var accountsPath = require('../paths/accounts')
var argon2 = require('argon2')
var crypto = require('crypto')
var ecb = require('ecb')
var encode = require('../data/encode')
var fs = require('fs')
var generateKeypair = require('../data/generate-keypair')
var html = require('../html')
var licensorPath = require('../paths/licensor')
var mkdirp = require('mkdirp')
var outline = require('outline-numbering')
var parseJSON = require('json-parse-errback')
var path = require('path')
var requestStripeCredentials = require('../stripe/request-credentials')
var runWaterfall = require('run-waterfall')
var stripANSI = require('strip-ansi')
var stripeNoncePath = require('../paths/stripe-nonce')
var terms = require('../forms/terms')
var toANSI = require('commonform-terminal')
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
  <link rel=stylesheet href=/normalize.css>
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
          fs.unlink(nonceFile, ecb(done, function (error) {
            request.log.error(error)
            done(null, read)
          }))
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
            done(null, nonceData)
          } else {
            var error = new Error('invalid nonce file')
            error.statusCode = 500
            done(error)
          }
        },
        function (nonceData, done) {
          requestStripeCredentials(
            service, query.code,
            function (error, results) {
              /* istanbul ignore if */
              if (error) {
                error.statusCode = 500
              }
              done(error, results, nonceData)
            }
          )
        },
        function validateStripeBody (body, nonceData, done) {
          if (body.error) {
            request.log.error(body, 'stripe error')
            body.error.statusCode = 500
            done(body.error)
          } else if (
            !['stripe_user_id', 'refresh_token']
              .every(function (key) {
                return isNonEmptyString(body[key])
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
          var licensorID = uuid()
          var licensorFile = licensorPath(service, licensorID)
          var keypair = generateKeypair()
          var passphrase = encode(crypto.randomBytes(32))
          var stripeID = stripeData.stripe_user_id
          runWaterfall([
            mkdirp.bind(null, path.dirname(licensorFile)),
            function hashPassphrase (_, done) {
              argon2.hash(passphrase)
                .catch(done)
                .then(function (result) {
                  done(null, result)
                })
            },
            function writeLicensorFile (hash, done) {
              fs.writeFile(
                licensorFile,
                JSON.stringify({
                  licensorID: licensorID,
                  name: nonceData.name,
                  email: nonceData.email,
                  jurisdiction: nonceData.jurisdiction,
                  registered: new Date().toISOString(),
                  password: hash,
                  publicKey: encode(keypair.publicKey),
                  privateKey: encode(keypair.privateKey),
                  stripe: {
                    id: stripeID,
                    refresh: stripeData.refresh_token
                  }
                }),
                done
              )
            }
          ], ecb(done, function () {
            service.email({
              to: 'registrations@licensezero.com',
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
              if (error) service.log.error(error)
            })
            done(
              null, nonceData.email, licensorID, stripeID,
              encode(keypair.publicKey), passphrase
            )
          }))
        },
        function emailLicensor (
          email, licensorID, stripeID, publicKey, passphrase, done
        ) {
          runWaterfall([
            terms,
            function (terms, done) {
              service.email({
                to: email,
                subject: 'Licensor Registration',
                // TODO: Attach copy of terms of service
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
                      {numbering: outline}
                    )
                  ).replace(/^ {4}/, '')
                )
              }, ecb(done, function () {
                done(null, licensorID, stripeID, passphrase)
              }))
            }
          ], done)
        },
        function appendToAccounts (
          licensorID, stripeID, passphrase, done
        ) {
          var file = accountsPath(service)
          var line = stripeID + '\t' + licensorID + '\n'
          fs.appendFile(file, line, ecb(done, function () {
            done(null, licensorID, passphrase)
          }))
        }
      ], function (error, licensorID, passphrase) {
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
  <title>LicenseZero | Registration</title>
  <link rel=stylesheet href=/normalize.css>
  <link rel=stylesheet href=/styles.css>
</head>
<body>
  <h1>Registration Complete</h2>
  <p>You've connected your Stripe account to LicenseZero.</p>
  <p>
    To offer licenses, install the
    <a href=https://www.npmjs.com/package/licensezero-cli
      ><code>licensezero</code> command line interface</a>
    and import your licensor credentials:
  </p>
  <dl>
    <dt>Licensor ID</dt>
    <dd><code class=id>${licensorID}</code></dd>
    <dt>Access Token</dt>
    <dd><code class=token>${passphrase}</code></dd>
  </dl>
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

function isNonEmptyString (argument) {
  return typeof argument === 'string' && argument.length !== 0
}
