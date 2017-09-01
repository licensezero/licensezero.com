var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var nav = require('./partials/nav')
var publicLicense = require('../forms/public-license')

module.exports = function (request, response, service) {
  response.setHeader('Content-Type', 'text/html')
  response.end(html`
<!doctype html>
<html>
  ${head('Public License')}
  <body>
    ${nav()}
    ${header()}
    <main>
      <h1>Public License</h1>
      <p>
        The public license for products available through
        License Zero tiers is based on the two-clause BSD
        License, with significant changes.  You should
        consult your own lawyers about whether the
        terms meet your needs, and whether you need a <a
        href=/forms/private-licenses>private license</a>.
        As a starting point, however, consider the
        following major differences from the two-clause
        BSD License.  The License Zero Publice License:
      </p>
      <ol>
        <li>
          limits commercial use, other than work that
          produces contributions back to the product, to a
          grace period of a set number of calendar days
        </li>
        <li>
          drops the commercial use limit away if other
          licenses cease to be available, reducing the terms
          to the standard form two-clause BSD License
        </li>
        <li>
          include the public key with which License Zero
          will sign private licenses in the copyright notice
        </li>
      </ol>
      <pre class=license>${escape(publicLicense({
        name: 'Example Licensor',
        jurisdiction: 'US-CA',
        publicKey: 'X'.repeat(64),
        productID: 'XXXXXXXX-XXXX-4XXX-XXXX-XXXXXXXXXXXX',
        licensorID: 'XXXXXXXX-XXXX-4XXX XXXX-XXXXXXXXXXXX',
        grace: 180
      }))}</pre>
    </main>
    ${footer()}
  </body>
</html>
  `)
}
