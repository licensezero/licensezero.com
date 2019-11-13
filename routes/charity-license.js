var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var linkStandards = require('../util/link-standards')
var nav = require('./partials/nav')
var charityLicense = require('../forms/charity-license')

var REPOSITORY = (
  'https://github.com/licensezero/charity-public-license'
)

module.exports = function (request, response) {
  charityLicense({
    name: '{Licensor Name}',
    url: '{https://example.com/project}'
  }, function (error, document) {
    if (error) return internalError(request, response, error)
    response.setHeader('Content-Type', 'text/html')
    response.end(html`
<!doctype html>
<html>
  ${head('The Charity Public License', {
    title: 'The Charity Public License',
    description: 'a short, modern, permissive open source license'
  })}
  <body>
    ${nav()}
    ${header()}
    <main>
      <h1>The Charity Public License</h1>
      <p>
        To review changes to, and submit feedback about,
        the Charity Public License, visit
        <a href=${REPOSITORY}>${REPOSITORY}</a>.
      </p>
      <p>
        For more information, see
        <a href=https://guide.licensezero.com/#charity
          >the License Zero Developer’s Guide</a>.
      </p>
      <pre class=license>${linkStandards(escape(document))}</pre>
    </main>
    ${footer()}
  </body>
</html>
    `)
  })
}
