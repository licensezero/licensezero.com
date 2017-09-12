var fs = require('fs')
var generatePassword = require('../data/generate-password')
var hashPassword = require('../data/hash-password')
var internalError = require('./internal-error')
var licensorPath = require('../paths/licensor')
var lock = require('./lock')
var mutateJSONFile = require('../data/mutate-json-file')
var readJSONFile = require('../data/read-json-file')
var resetTokenPath = require('../paths/reset-token')
var runWaterfall = require('run-waterfall')

var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var nav = require('./partials/nav')

var ONE_DAY = 24 * 60 * 60 * 1000

module.exports = function (request, response, service) {
  var method = request.method
  if (method === 'GET') {
    get(request, response, service)
  } else {
    response.statusCode = 405
    response.end()
  }
}

function get (request, response, service) {
  var token = request.parameters.token
  var resetTokenFile = resetTokenPath(service, token)
  readJSONFile(resetTokenFile, function (error, tokenData) {
    if (error) {
      if (error.code === 'ENOENT') return notFound(response)
      service.log.error(error)
      return internalError(response)
    } else if (expired(tokenData.date)) {
      return notFound(response)
    }
    fs.unlink(resetTokenFile, function (error) {
      if (error) {
        service.log.error(error)
        return internalError(response)
      }
      var password = generatePassword()
      var licensorID = tokenData.licensorID
      lock(licensorID, function (release) {
        runWaterfall([
          hashPassword.bind(null, password),
          function writeLicensorFile (hash, done) {
            var licensorFile = licensorPath(service, licensorID)
            mutateJSONFile(licensorFile, function (data) {
              data.password = hash
            }, done)
          }
        ], release(function (error) {
          if (error) {
            service.log.error(error)
            return internalError(response)
          }
          response.setHeader('Content-Type', 'text/html')
          // TODO: new password CLI instructions
          response.end(html`
<!doctype html>
<html lang=EN>
${head()}
<body>
  ${nav()}
  ${header()}
  <main>
    <p>Your access token has been reset.  Your new access token is:</p>
    <pre><code class=token>${password}</code><pre>
  </main>
  ${footer()}
</body>
</html>
          `)
        }))
      })
    })
  })
}

function expired (created) {
  return (new Date() - new Date(created)) > ONE_DAY
}

function notFound (response) {
  response.statusCode = 404
  response.setHeader('Content-Type', 'text/html')
  response.end(html`
<!doctype html>
<html lang=en>
<head>
  <meta charset=UTF-8>
  <title>License Zero | Password Reset</title>
  <link rel=stylesheet href=/normalize.css>
  <link rel=stylesheet href=/styles.css>
</head>
<body>
  <main>
    <h1>Invalid or Expired Reset Link</h2>
    <p>
      The link you followed to reset a password
      is invalid or expired.
    </p>
  </main>
</body>
</html>
  `)
}
