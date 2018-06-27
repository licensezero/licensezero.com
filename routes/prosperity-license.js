
var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var linkStandards = require('./link-standards')
var nav = require('./partials/nav')
var prosperityLicense = require('../forms/prosperity-license')

var REPOSITORY = (
  'https://github.com/licensezero/prosperity-public-license'
)

module.exports = function (request, response, service) {
  prosperityLicense({
    name: '{Licensor Name}',
    homepage: '{https://example.com/project}'
  }, function (error, document) {
    if (error) {
      service.log.error(error)
      return internalError(response, error)
    }
    response.setHeader('Content-Type', 'text/html')
    response.end(html`
<!doctype html>
<html>
  ${head('The Prosperity Public License')}
  <body>
    ${nav()}
    ${header()}
    <main>
      <h1>The Prosperity Public License</h1>
      <p>
        To review changes to, and submit feedback about,
        the Prosperity Public License, visit
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
