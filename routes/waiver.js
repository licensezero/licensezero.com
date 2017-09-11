var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var nav = require('./partials/nav')
var runParallel = require('run-parallel')
var waiver = require('../forms/waiver')

var REPOSITORY = 'https://github.com/licensezero/licensezero-waiver'

module.exports = function (request, response, service) {
  runParallel({
    forever: waiver.bind(null, {
      licensor: {
        name: '{Licensor Name}',
        jurisdiction: '{Licensor Jurisdiction}'
      },
      beneficiary: {
        name: '{Beneficiary Name}',
        jurisdiction: '{Beneficiary Jurisdiction}'
      },
      project: {
        projectID: '{Project ID}',
        description: '{Project Description}',
        repository: '{Project Repository}'
      },
      date: '{Date}',
      term: 'forever'
    }),
    term: waiver.bind(null, {
      licensor: {
        name: '{Licensor Name}',
        jurisdiction: '{Licensor Jurisdiction}'
      },
      beneficiary: {
        name: '{Beneficiary Name}',
        jurisdiction: '{Beneficiary Jurisdiction}'
      },
      project: {
        projectID: '{Project ID}',
        description: '{Project Description}',
        repository: '{Project Repository}'
      },
      date: '{Date}',
      term: '____'
    })
  }, function (error, results) {
    if (error) {
      service.log.error(error)
      return internalError(response, error)
    }
    response.setHeader('Content-Type', 'text/html')
    response.end(html`
<!doctype html>
<html>
  ${head()}
  <body>
    ${nav()}
    ${header()}
    <main>
      <h1>Waiver</h1>
      <p>
        License Zero permits licensors to waive the
        condition of the
        <a href=/licenses/public>License Zero Public License</a>
        limiting commercial use for specific beneficiaries,
        using a standard form waiver.
      </p>
      <p>
        To review changes to, and submit feedback about,
        the License Zero form waiver, visit
        <a href=${REPOSITORY}>${REPOSITORY}</a>.
      </p>
      <h2>For a Term</h2>
      <pre class=license>${escape(results.term)}</pre>
      <h2>Forever</h2>
      <pre class=license>${escape(results.forever)}</pre>
    </main>
    ${footer()}
  </body>
</html>
    `)
  })
}
