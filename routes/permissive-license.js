var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var linkStandards = require('../util/link-standards')
var nav = require('./partials/nav')
var permissiveLicense = require('../forms/permissive-license')

var REPOSITORY = (
  'https://github.com/licensezero/licensezero-permissive-public-license'
)

module.exports = function (request, response) {
  permissiveLicense({
    name: '{Licensor Name}',
    source: '{https://example.com/project}'
  }, function (error, document) {
    if (error) return internalError(request, response, error)
    response.setHeader('Content-Type', 'text/html')
    response.end(html`
<!doctype html>
<html>
  ${head('Permissive Public License')}
  <body>
    ${nav()}
    ${header()}
    <main>
      <h1>Permissive Public License</h1>
      <p>
        The permissive public license is a short,
        academic-style open source software license
        for the twenty-first century.
        License Zero maintainers may offer to
        relicense their projects under this license
        for a fee.
        Other developers are free to use L0-P for
        projects that do not use License Zero, too.
      </p>
      <p>
        To review changes to, and submit feedback about,
        the License Zero Permissive Public License, visit
        <a href=${REPOSITORY}>${REPOSITORY}</a>.
      </p>
      <pre class=license>${linkStandards(escape(document))}</pre>
    </main>
    ${footer()}
  </body>
</html>
    `)
  })
}
