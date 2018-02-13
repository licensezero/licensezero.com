var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var linkStandards = require('./link-standards')
var nav = require('./partials/nav')
var privateLicense = require('../forms/private-license')

var REPOSITORY = (
  'https://github.com/licensezero/licensezero-private-license'
)

// TODO: Explain the private license.

module.exports = function (request, response, service) {
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
    if (error) {
      service.log.error(error)
      return internalError(response, error)
    }
    response.setHeader('Content-Type', 'text/html')
    response.end(html`
<!doctype html>
<html>
  ${head('Private Licenses')}
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
      <pre class=license>${linkStandards(escape(result))}</pre>
    </main>
    ${footer()}
  </body>
</html>
    `)
  })
}
