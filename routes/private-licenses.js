var TIERS = require('../data/private-license-tiers')
var capitalize = require('./capitalize')
var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var nav = require('./partials/nav')
var privateLicense = require('../forms/private-license')
var runParallel = require('run-parallel')

var REPOSITORY = (
  'https://github.com/licensezero/licensezero-private-licenses'
)

module.exports = function (request, response, service) {
  runParallel(Object.keys(TIERS).reduce(function (jobs, key) {
    jobs[key] = privateLicense.bind(null, {
      date: '2017-09-01T12:00:00.000Z',
      tier: key,
      licensee: {
        name: 'Example Licensee',
        jurisdiction: 'US-CA'
      },
      licensor: {
        name: 'Example Licensor',
        jurisdiction: 'US-CA'
      },
      projectID: 'XXXXXXXX-XXXX-4XXX-XXXX-XXXXXXXXXXXX',
      description: 'a fake project to demonstrate license terms',
      repository: 'https://licensezero.com/licenses/private-license'
    })
    return jobs
  }, {}), function (error, results) {
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
        Private licenses for sale through License Zero
        come in four distinct “tiers”:
      </p>
      <dl>
        ${Object.keys(TIERS).map(function (tier) {
          return html`
            <dt>
              ${escape(capitalize(tier))}
            </dt>
            <dd>
              <a href="#${escape(tier)}">
                ${(TIERS[tier] || 'unlimited').toString()}
                ${
                  TIERS[tier] === null || TIERS[tier] > 1
                    ? 'users'
                    : 'user'
                  }
              </a>
            </dd>
          `
        })}
      </dl>
      <p>
        The form license for each tiers is
        <a href=/licenses/private/diff>
        based on The Apache License, Version 2.0</a>,
        with significant
        changes.  You should consult your own lawyers about
        whether the terms suit your needs.  As a starting
        point, however, consider the following major
        differences from The Apache License, Version 2.0.
        License Zero forms:
      </p>
      <ol>
        <li>
          identify the licensor (“Licensor”) and
          licensee (“You”) explicitly, by legal name
          and jurisdiction.
        </li>
        <li>
          define the “Work” to cover both the software
          as it currently exists, and versions released
          in the future.
        </li>
        <li>
          forms omit terms about outside contributions
          and contributors.
        </li>
        <li>
          do not require prominent notices of changes to
          source code.
        </li>
        <li>
          do not require redistribution of
          <code>NOTICE</code> files.
        </li>
        <li>
          limit sublicensing to a limited number of
          individual users, like employees and contractors.
        </li>
      </ol>
      <p>
        To review changes to, and submit feeback about,
        the License Zero private licenses, visit
        <a href=${REPOSITORY}>${REPOSITORY}</a>.
      </p>
      ${Object.keys(results).map(function (tier) {
        return html`
          <h3 id="${escape(tier)}">${escape(capitalize(tier))} Tier</h3>
          <pre class=license>${escape(results[tier])}</pre>
        `
      })}
    </main>
    ${footer()}
  </body>
</html>
    `)
  })
}
