var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var nav = require('./partials/nav')
var parityLicense = require('../forms/parity-license')
var renderMarkdown = require('../util/render-markdown')

var REPOSITORY = (
  'https://github.com/licensezero/parity-public-license'
)

module.exports = function (request, response) {
  parityLicense({
    name: '{Licensor Name}',
    url: '{https://example.com/project}'
  }, function (error, form) {
    if (error) return internalError(request, response, error)
    response.setHeader('Content-Type', 'text/html')
    response.end(html`
<!doctype html>
<html>
  ${head('The Parity Public License', {
    title: 'The Parity Public License',
    description: 'a strong, share-alike open software license'
  })}
  <body>
    ${nav()}
    ${header()}
    <main>
      <h1>The Parity Public License</h1>
      <p>
        <a href=https://paritylicense.com>paritylicense.com</a>
      </p>
      <p>
        To review changes to, and submit feedback about,
        the Parity Public License, visit
        <a href=${REPOSITORY}>${REPOSITORY}</a>.
      </p>
      <p>
        For more information, see
        <a href=https://guide.licensezero.com/#parity
          >the License Zero Developer’s Guide</a>.
      </p>
      <blockquote class=license>${renderMarkdown(form)}</blockquote>
    </main>
    ${footer()}
  </body>
</html>
    `)
  })
}
