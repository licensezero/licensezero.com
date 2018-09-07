var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var linkStandards = require('../util/link-standards')
var nav = require('./partials/nav')
var noncommercialLicense = require('../forms/noncommercial-license')

var REPOSITORY = (
  'https://github.com/licensezero/licensezero-noncommercial-public-license'
)

module.exports = function (request, response) {
  noncommercialLicense({
    name: '{Licensor Name}',
    source: '{https://example.com/project}'
  }, function (error, document) {
    if (error) {
      request.log.error(error)
      return internalError(response, error)
    }
    response.setHeader('Content-Type', 'text/html')
    response.end(html`
<!doctype html>
<html>
  ${head('Noncommercial Public License')}
  <body>
    ${nav()}
    ${header()}
    <main>
      <h1>Noncommercial Public License</h1>
      <p>
        Note:
        This noncommercial license has been replaced by
        <a href=/licenses/prosperity>The Prosperity Public License</a>
        for License Zero projects going forward.
      </p>
      <p>
        To review changes to, and submit feedback about,
        the License Zero Noncommercial Public License, visit
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
