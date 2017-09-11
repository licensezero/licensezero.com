var TIERS = require('../data/private-license-tiers')
var capitalize = require('./capitalize')
var diff = require('diff')
var diffElements = require('./partials/diff-elements')
var escape = require('./escape')
var footer = require('./partials/footer')
var fs = require('fs')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var nav = require('./partials/nav')
var path = require('path')
var privateLicense = require('../forms/private-license')
var runParallel = require('run-parallel')

module.exports = function (request, response, service) {
  var jobs = {}
  Object.keys(TIERS).forEach(function (key) {
    jobs[key] = privateLicense.bind(null, {
      date: '{Date}',
      tier: key,
      licensee: {
        name: '{Licensee Name}',
        jurisdiction: '{Licensee Jurisdiction}'
      },
      licensor: {
        name: '{Licensor Name}',
        jurisdiction: '{Licensor Jurisdiction}'
      },
      projectID: '{Project ID}',
      description: '{Project Description}',
      repository: '{Project Repository}'
    })
  })
  jobs.apache = function (done) {
    var file = path.join(
      __dirname, '..', 'forms', 'private-licenses', 'Apache-2.0'
    )
    fs.readFile(file, 'utf8', done)
  }
  runParallel(jobs, function (error, results) {
    if (error) {
      service.log.error(error)
      return internalError(response, error)
    }
    console.log(Object.keys(results))
    response.setHeader('Content-Type', 'text/html')
    response.end(html`
<!doctype html>
<html>
  ${head('Private Licenses')}
  <body>
    ${nav()}
    ${header()}
    <main>
      <h1>Apache-2.0 &rarr; Private Licenses</h1>
      <ol>
        ${Object.keys(TIERS).map(function (tier) {
          return html`
            <li>
              <a href="#${escape(tier)}">
                ${escape(capitalize(tier))}
              </a>
            </li>
          `
        })}
      </ol>
      ${Object.keys(TIERS).map(function (tier) {
        var patch = diff.diffLines(results.apache, results[tier])
        return html`
          <h3 id="${escape(tier)}">Apache-2.0 &rarr; ${escape(capitalize(tier))} Tier</h3>
          <pre class=license>${diffElements(patch)}</pre>
        `
      })}
    </main>
    ${footer()}
  </body>
</html>
    `)
  })
}
