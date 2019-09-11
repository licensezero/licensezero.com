var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var linkStandards = require('../util/link-standards')
var nav = require('./partials/nav')
var privateLicense = require('../forms/private-license')

var REPOSITORY = (
  'https://github.com/licensezero/licensezero-private-license'
)

module.exports = function (request, response) {
  privateLicense({
    date: '{Date}',
    licensee: {
      name: '{Licensee Name}',
      jurisdiction: '{Licensee Jurisdiction, e.g "US-CA"}'
    },
    licensor: {
      name: '{Licensor Name}',
      jurisdiction: '{Licensor Name, e.g. "US-NY"}'
    },
    projectID: '{Project ID}',
    description: '{Project Description}',
    homepage: '{Project Homepage URL}'
  }, function (error, result) {
    if (error) return internalError(request, response, error)
    response.setHeader('Content-Type', 'text/html')
    response.end(html`
<!doctype html>
<html>
  ${head('Private Licenses', {
    title: 'Private Licenses',
    description: 'private licenses sold through licensezero.com'
  })}
  <body>
    ${nav()}
    ${header()}
    <main>
      <h1>Private Licenses</h1>
      <p>
        To review changes to, and submit feedback about,
        the License Zero private license, visit
        <a href=${REPOSITORY}>${REPOSITORY}</a>.
      </p>
      <p>
        For more information, see
        <a href=https://guide.licensezero.com/#private-licenses
          >the License Zero Developer’s Guide</a>.
      </p>
      <pre class=license>${linkStandards(escape(result))}</pre>
    </main>
    ${footer()}
  </body>
</html>
    `)
  })
}
