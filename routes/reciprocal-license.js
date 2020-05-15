var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var linkStandards = require('../util/link-standards')
var nav = require('./partials/nav')
var reciprocalLicense = require('../forms/reciprocal-license')

var REPOSITORY = (
  'https://github.com/licensezero/licensezero-reciprocal-license'
)

module.exports = function (request, response) {
  reciprocalLicense({
    name: '{Developer Name}',
    homepage: '{https://example.com/project}'
  }, function (error, document) {
    if (error) return internalError(request, response, error)
    response.setHeader('Content-Type', 'text/html')
    response.end(html`
<!doctype html>
<html>
  ${head('Reciprocal Public License')}
  <body>
    ${nav()}
    ${header()}
    <main role=main>
      <h1>Reciprocal Public License</h1>
      <p>
        Note:
        This reciprocal license has been replaced by
        <a href=/licenses/parity>The Parity Public License</a>
        for License Zero offers going forward.
      </p>
      <p>
        To review changes to, and submit feedback about,
        the License Zero Reciprocal Public License, visit
        <a href=${REPOSITORY}>${REPOSITORY}</a>.
      </p>
      <pre class=form>${linkStandards(escape(document))}</pre>
    </main>
    ${footer()}
  </body>
</html>
    `)
  })
}
