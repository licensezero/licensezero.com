var diff = require('diff')
var diffElements = require('./partials/diff-elements')
var footer = require('./partials/footer')
var fs = require('fs')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var nav = require('./partials/nav')
var path = require('path')
var reciprocalLicense = require('../forms/reciprocal-license')
var runParallel = require('run-parallel')

module.exports = function (request, response, service) {
  runParallel({
    zero: function (done) {
      reciprocalLicense({
        name: '{Licensor Name}',
        jurisdiction: '{Licensor Jurisdiction}',
        publicKey: '_'.repeat(64),
        projectID: '{Project ID}',
        repository: '{https://example.com/project}'
      }, done)
    },
    bsd: function (done) {
      var file = path.join(
        __dirname, '..', 'forms', 'reciprocal-license', 'BSD-2-Clause'
      )
      fs.readFile(file, 'utf8', done)
    }
  }, function (error, results) {
    if (error) {
      service.log.error(error)
      return internalError(response, error)
    }
    var patch = diff.diffLines(results.bsd, results.zero)
    response.setHeader('Content-Type', 'text/html')
    response.end(html`
<!doctype html>
<html>
  ${head('Reciprocal Public License')}
  <body>
    ${nav()}
    ${header()}
    <main>
      <h1>BSD-2-Clause &rarr; License Zero Reciprocal Public License</h1>
      <pre class=license>${diffElements(patch)}</pre>
    ${footer()}
  </body>
</html>
    `)
  })
}
