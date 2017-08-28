var fs = require('fs')
var generatePassword = require('../data/generate-password')
var hashPassword = require('../data/hash-password')
var html = require('../html')
var internalError = require('./internal-error')
var licensorPath = require('../paths/licensor')
var lock = require('./lock')
var readJSONFile = require('../data/read-json-file')
var readLicensor = require('../data/read-licensor')
var resetTokenPath = require('../paths/reset-token')
var runParallel = require('run-parallel')
var runWaterfall = require('run-waterfall')

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
          runParallel.bind(null, {
            licensor: readLicensor.bind(null, service, licensorID),
            hash: hashPassword.bind(null, password)
          }),
          function writeLicensorFile (prior, done) {
            var licensor = prior.licensor
            licensor.password = prior.hash
            var licensorFile = licensorPath(service, licensorID)
            fs.writeFile(licensorFile, JSON.stringify(licensor), done)
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
<html lang=en>
<head>
  <meta charset=UTF-8>
  <title>License Zero | Password Reset</title>
  <link rel=stylesheet href=/normalize.css>
  <link rel=stylesheet href=/styles.css>
</head>
<body>
  <header>
    <h1>License Zero | Password Reset</h1>
  </header>
  <main>
    <p>Your password has been reset.  Your new password is:</p>
    <pre><code class=token>${password}</code><pre>
  </main>
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
