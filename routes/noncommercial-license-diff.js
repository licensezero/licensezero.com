var diff = require('diff')
var diffElements = require('./partials/diff-elements')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var nav = require('./partials/nav')
var noncommercialLicense = require('../forms/noncommercial-license')
var permissiveLicense = require('../forms/permissive-license')
var runParallel = require('run-parallel')

module.exports = function (request, response, service) {
  runParallel({
    noncommercial: function (done) {
      noncommercialLicense({
        name: '{Licensor Name}',
        repository: '{https://example.com/project}'
      }, done)
    },
    permissive: function (done) {
      permissiveLicense({
        name: '{Licensor Name}',
        repository: '{https://example.com/project}'
      }, done)
    }
  }, function (error, results) {
    if (error) {
      service.log.error(error)
      return internalError(response, error)
    }
    var patch = diff.diffLines(results.permissive, results.noncommercial)
    response.setHeader('Content-Type', 'text/html')
    response.end(html`
<!doctype html>
<html>
  ${head('Noncommercial Public License')}
  <body>
    ${nav()}
    ${header()}
    <main>
      <h1>Permissive &rarr; Noncommercial</h1>
      <pre class=license>${diffElements(patch)}</pre>
    ${footer()}
  </body>
</html>
    `)
  })
}
