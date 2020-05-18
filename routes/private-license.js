var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var nav = require('./partials/nav')
var prepareBlanks = require('commonform-prepare-blanks')
var privateLicense = require('../forms/private-license')
var toHTML = require('commonform-html')

var REPOSITORY = (
  'https://github.com/licensezero/licensezero-private-license'
)

module.exports = function (request, response) {
  privateLicense(function (error, parsed) {
    if (error) return internalError(request, response, error)
    var rendered = toHTML(
      parsed.form,
      prepareBlanks(
        {
          date: '{Date}',
          'developer name': '{Developer Name}',
          'developer jurisdiction': '{Developer Jurisdiction, e.g. "US-NY"}',
          'developer e-mail': '{Developer E-Mail}',
          'user name': '{User Name}',
          'user jurisdiction': '{User Jurisdiction, e.g. "US-NY"}',
          'user e-mail': '{User E-Mail}',
          'agent name': 'Artless Devices LLC',
          'agent jurisdiction': 'US-CA',
          'agent website': 'https://artlessdevices.com',
          'offer identifier': '{Offer ID}',
          'project description': '{Project Description}',
          'project repository': '{Project Repository URL}',
          term: '{Term}',
          price: '{Price}'
        },
        parsed.directions
      ),
      {
        title: parsed.frontMatter.title,
        edition: parsed.frontMatter.version,
        classNames: ['form'],
        lists: true,
        ids: true,
        html5: true
      }
    )
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
    <main role=main>
      <h1>Private License</h1>
      <p>
        To review changes to, and submit feedback about,
        the License Zero private license, visit
        <a href=${REPOSITORY}>${REPOSITORY}</a>.
      </p>
      <p>
        For more information, see
        <a href=https://guide.licensezero.com/#private-license
          >the License Zero Developer’s Guide</a>.
      </p>
      ${rendered}
    </main>
    ${footer()}
  </body>
</html>
    `)
  })
}
