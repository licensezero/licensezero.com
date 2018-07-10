var diff = require('diff')
var diffElements = require('./partials/diff-elements')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var nav = require('./partials/nav')
var permissiveLicense = require('../forms/permissive-license')
var reciprocalLicense = require('../forms/reciprocal-license')
var runParallel = require('run-parallel')

module.exports = function (request, response) {
  runParallel({
    reciprocal: function (done) {
      reciprocalLicense({
        name: '{Licensor Name}',
        homepage: '{https://example.com/project}'
      }, done)
    },
    permissive: function (done) {
      permissiveLicense({
        name: '{Licensor Name}',
        source: '{https://example.com/project}'
      }, done)
    }
  }, function (error, results) {
    if (error) {
      request.log.error(error)
      return internalError(response, error)
    }
    var patch = diff.diffLines(results.permissive, results.reciprocal)
    response.setHeader('Content-Type', 'text/html')
    response.end(html`
<!doctype html>
<html>
  ${head('Reciprocal Public License')}
  <body>
    ${nav()}
    ${header()}
    <main>
      <h1>Permissive &rarr; Reciprocal</h1>
      <pre class=license>${diffElements(patch)}</pre>
    ${footer()}
  </body>
</html>
    `)
  })
}
