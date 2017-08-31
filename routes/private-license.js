var TIERS = require('../data/private-license-tiers')
var capitalize = require('./capitalize')
var escape = require('../escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var privateLicense = require('../forms/private-license')

module.exports = function (request, response, service) {
  response.setHeader('Content-Type', 'text/html')
  response.end(html`
<!doctype html>
<html>
  ${head()}
  <body>
    ${header()}
    <main>
      <h2>Example Private Licenses</h2>
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
                ${TIERS[tier] === null || TIERS[tier] > 1 ? 'users' : 'user'}
              </a>
            </dd>
          `
        })}
      </dl>
      <p>
        The form license for each tiers is based on The
        Apache License, Version 2.0, with significant
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
      ${Object.keys(TIERS).map(function (tier) {
        return html`
          <h3 id="${escape(tier)}">${escape(capitalize(tier))} Tier</h3>
          <pre class=license>${escape(privateLicense({
            date: '2017-09-01T12:00:00.000Z',
            tier: tier,
            licensee: {
              name: 'Example Licensee',
              jurisdiction: 'US-CA'
            },
            licensor: {
              name: 'Example Licensor',
              jurisdiction: 'US-CA'
            },
            productID: 'XXXXXXXX-XXXX-4XXX-XXXX-XXXXXXXXXXXX',
            description: 'a fake product to demonstrate license terms',
            repository: 'https://licensezero.com/forms/private-license'
          }))}</pre>
        `
      })}
    </main>
    ${footer()}
  </body>
</html>
  `)
}
