var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var linkStandards = require('./link-standards')
var nav = require('./partials/nav')
var reciprocalLicense = require('../forms/reciprocal-license')

var REPOSITORY = (
  'https://github.com/licensezero/licensezero-reciprocal-license'
)

module.exports = function (request, response, service) {
  reciprocalLicense({
    name: '{Licensor Name}',
    jurisdiction: '{Jurisdiction Code, e.g. "US-CA"}',
    publicKey: '_'.repeat(64),
    projectID: '{Project ID}',
    repository: '{https://example.com/project}'
  }, function (error, document) {
    if (error) {
      service.log.error(error)
      return internalError(response, error)
    }
    response.setHeader('Content-Type', 'text/html')
    response.end(html`
<!doctype html>
<html>
  ${head('Reciprocal Public License')}
  <body>
    ${nav()}
    ${header()}
    <main>
      <h1>Reciprocal Public License</h1>
      <p>
        License Zero projects are publicly licensed
        on the terms of either the following reciprocal
        license, or an alternative
        <a href=/licenses/noncommercial>noncommercial public license</a>.
      </p>
      <p>
        The reciprocal public license is
        <a href=/licenses/reciprocal/diff>based on the two-clause BSD</a>
        License, with significant changes.  You should
        consult your own lawyers about whether the
        terms meet your needs, and whether you need a <a
        href=/licenses/private>private license</a>.
        As a starting point, however, consider the
        following major differences from the two-clause
        BSD License.  The License Zero Reciprocal Public License:
      </p>
      <ol>
        <li>
          requires publication of source code and Open Source
          licensing of computer programs executed or developed
          with the License Zero software for more than 90
          calendar days
        </li>
        <li>
          drops the time limit away if other
          licenses cease to be available, reducing the terms
          to the standard form two-clause BSD License
        </li>
        <li>
          include the public key with which License Zero
          will sign private licenses in the copyright notice
        </li>
      </ol>
      <p>
        To review changes to, and submit feedback about,
        the License Zero Reciprocal Public License, visit
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
