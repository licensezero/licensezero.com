var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var linkStandards = require('../util/link-standards')
var nav = require('./partials/nav')
var runParallel = require('run-parallel')
var waiver = require('../forms/waiver')
var xtend = require('xtend')

var REPOSITORY = 'https://github.com/licensezero/licensezero-waiver'

module.exports = function (request, response) {
  var common = {
    licensor: {
      name: '{Licensor Name}',
      jurisdiction: '{Licensor Jurisdiction, e.g. "US-TX"}'
    },
    beneficiary: {
      name: '{Beneficiary Name}',
      jurisdiction: '{Beneficiary Jurisdiction, e.g. "US-NY"}'
    },
    project: {
      projectID: '{Project ID}',
      description: '{Project Description}',
      homepage: '{Project Homepage URL}'
    },
    date: '{Date}',
    term: 'Forever'
  }
  runParallel({
    forever: waiver.bind(null, xtend(common, {term: 'forever'})),
    term: waiver.bind(null, xtend(common, {term: '10'}))
  }, function (error, results) {
    if (error) {
      request.log.error(error)
      return internalError(response, error)
    }
    response.setHeader('Content-Type', 'text/html')
    response.end(html`
<!doctype html>
<html>
  ${head('Waiver', {
    title: 'Waiver',
    description: 'form waiver for software licensed through licensezero.com'
  })}
  <body>
    ${nav()}
    ${header()}
    <main>
      <h1>Waiver</h1>
      <p>
        License Zero permits licensors to waive the share-back
        and limited commercial use conditions of their public
        licenses for specific beneficiaries, using a standard
        form waiver.
      </p>
      <p>
        To review changes to, and submit feedback about,
        the License Zero form waiver, visit
        <a href=${REPOSITORY}>${REPOSITORY}</a>.
      </p>
      <h2>For a Term</h2>
      <pre class=license>${linkStandards(escape(results.term))}</pre>
      <h2>Forever</h2>
      <pre class=license>${linkStandards(escape(results.forever))}</pre>
    </main>
    ${footer()}
  </body>
</html>
    `)
  })
}
