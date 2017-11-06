var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var linkStandards = require('./link-standards')
var nav = require('./partials/nav')
var permissiveLicense = require('../forms/permissive-license')

var REPOSITORY = (
  'https://github.com/licensezero/licensezero-permissive-public-license'
)

module.exports = function (request, response, service) {
  permissiveLicense({
    name: '{Licensor Name}',
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
        L0-P is short and to the point, like
        <a href=https://spdx.org/licenses/MIT>MIT</a>
        or
        <a href=https://spdx.org/licenses/BSD-2-Clause>BSD</a>,
        with a few critical improvements:
      </p>
      <ul>
        <li>
          L0-P grants clear permission under both copyrights
          and patent claims.
        </li>
        <li>
          L0-P includes a strong patent termination provision.
        </li>
        <li>
          L0-P reads fine coming from multiple contributors.
          It can also be used in projects combining L0-P-licensed
          work and software under other terms.
        </li>
        <li>
          In addition to a copyright notice, L0-P has a line
          showing where others can find source code.
        </li>
      </ul>
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
