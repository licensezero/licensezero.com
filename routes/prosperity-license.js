var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var nav = require('./partials/nav')
var prosperityLicense = require('../forms/prosperity-license')
var renderMarkdown = require('../util/render-markdown')

var REPOSITORY = (
  'https://github.com/licensezero/prosperity-public-license'
)

module.exports = function (request, response) {
  prosperityLicense({
    name: '{Licensor Name}',
    homepage: '{https://example.com/project}'
  }, function (error, form) {
    if (error) return internalError(request, response, error)
    response.setHeader('Content-Type', 'text/html')
    response.end(html`
<!doctype html>
<html>
  ${head('The Prosperity Public License', {
    title: 'The Prosperity Public License',
    description: 'a noncommercial license for open software'
  })}
  <body>
    ${nav()}
    ${header()}
    <main>
      <h1>The Prosperity Public License</h1>
      <p class=download>
        <a href=/Prosperity-3.0.0.md download=LICENSE.md>
          Download <code>LICENSE.md</code> for Your Project
        </a>
      </p>
      <p>
        <a href=https://prosperitylicense.com>prosperitylicense.com</a>
      </p>
      <p>
        To review changes to, and submit feedback about,
        the Prosperity Public License, visit
        <a href=${REPOSITORY}>${REPOSITORY}</a>.
      </p>
      <p>
        For more information, see
        <a href=https://guide.licensezero.com/#prosperity
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
