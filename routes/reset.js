var fs = require('fs')
var generateToken = require('../data/generate-token')
var hashToken = require('../data/hash-token')
var internalError = require('./internal-error')
var licensorPath = require('../paths/licensor')
var lock = require('./lock')
var mutateJSONFile = require('../data/mutate-json-file')
var readJSONFile = require('../data/read-json-file')
var resetTokenPath = require('../paths/reset-token')
var runWaterfall = require('run-waterfall')

var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var nav = require('./partials/nav')

var ONE_DAY = 24 * 60 * 60 * 1000

module.exports = function (request, response) {
  var method = request.method
  if (method === 'GET') return get(request, response)
  response.statusCode = 405
  response.end()
}

function get (request, response) {
  var token = request.parameters.token
  var resetTokenFile = resetTokenPath(token)
  readJSONFile(resetTokenFile, function (error, tokenData) {
    if (error) {
      if (error.code === 'ENOENT') return tokenNotFound(response)
      return internalError(request, response, error)
    }
    if (expired(tokenData.date)) return tokenNotFound(response)
    fs.unlink(resetTokenFile, function (error) {
      if (error) return internalError(request, response, error)
      var token = generateToken()
      var licensorID = tokenData.licensorID
      lock(licensorID, function (release) {
        runWaterfall([
          hashToken.bind(null, token),
          function writeLicensorFile (hash, done) {
            var licensorFile = licensorPath(licensorID)
            mutateJSONFile(licensorFile, function (data) {
              data.token = hash
            }, done)
          }
        ], release(function (error) {
          if (error) return internalError(request, response, error)
          response.setHeader('Content-Type', 'text/html')
          response.end(html`
<!doctype html>
<html lang=EN>
${head()}
<body>
  ${nav()}
  ${header()}
  <main>
    <p>Your access token has been reset.  Your new access token is:</p>
    <pre><code class=token>${token}</code><pre>
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

function tokenNotFound (response) {
  response.statusCode = 404
  response.setHeader('Content-Type', 'text/html')
  response.end(html`
<!doctype html>
<html lang=en>
<head>
  <meta charset=UTF-8>
  <title>License Zero | Token Reset</title>
  <link rel=stylesheet href=https://static.licensezero.com/normalize.css>
  <link rel=stylesheet href=/styles.css>
</head>
<body>
  <main>
    <h1>Invalid or Expired Reset Link</h2>
    <p>
      The link you followed to reset a token
      is invalid or expired.
    </p>
  </main>
</body>
</html>
  `)
}
