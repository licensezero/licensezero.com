var accountsPath = require('../paths/accounts')
var email = require('../email')
var footer = require('./partials/footer')
var fs = require('fs')
var generateToken = require('../data/generate-token')
var hashToken = require('../data/hash-token')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var developerPath = require('../paths/developer')
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
var uuid = require('uuid').v4

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
  <main role=main>
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
          if (error) request.log.error(error)
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
      function writeDeveloperFile (stripeData, nonceData, done) {
        var developerID = uuid()
        var developerFile = developerPath(developerID)
        var passphrase = generateToken()
        var stripeID = stripeData.stripe_user_id
        runWaterfall([
          fs.mkdir.bind(fs, path.dirname(developerFile), { recursive: true }),
          function (done) {
            hashToken(passphrase, done)
          },
          function (hash, done) {
            fs.writeFile(
              developerFile,
              JSON.stringify({
                developerID,
                name: [nonceData.name],
                email: [nonceData.email],
                jurisdiction: [nonceData.jurisdiction],
                registered: new Date().toISOString(),
                token: hash,
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
            to: process.env.REGISTRATION_NOTIFICATION_EMAIL,
            subject: 'Developer Registration',
            text: [
              'id: ' + developerID,
              'name: ' + nonceData.name,
              'email: ' + nonceData.email,
              'jurisdiction: ' + nonceData.jurisdiction
            ].join('\n\n')
          }, function (error) {
            if (error) request.log.error(error)
          })
          done(
            null, nonceData.email, developerID, stripeID, passphrase
          )
        })
      },
      function emailDeveloper (
        address, developerID, stripeID, passphrase, done
      ) {
        runWaterfall([
          terms,
          function (terms, done) {
            email(request.log, {
              to: address,
              subject: 'Developer Registration',
              text: [
                'Thank you for registering as a developer',
                'though licensezero.com.',
                '',
                'Your unique developer ID is:',
                developerID
              ].join('\n'),
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
              done(null, developerID, stripeID, passphrase)
            })
          }
        ], done)
      },
      function appendToAccounts (
        developerID, stripeID, passphrase, done
      ) {
        var file = accountsPath()
        var line = stripeID + '\t' + developerID + '\n'
        fs.appendFile(file, line, function (error) {
          if (error) return done(error)
          request.log.info('appended to accounts')
          done(null, developerID, passphrase)
        })
      }
    ], function (error, developerID, passphrase) {
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
<main role=main>
  <h1>Registration Complete</h2>
  <p>You've connected your Stripe account to LicenseZero.</p>
  <p>
    To offer licenses, install the
    <a href=https://github.com/licensezero/cli
      ><code>licensezero</code> command line interface</a>
    and import your developer credentials:
  </p>
  <code class=terminal>licensezero token --developer <span class=id>${developerID}</span></code>
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
