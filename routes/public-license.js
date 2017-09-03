var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var nav = require('./partials/nav')
var publicLicense = require('../forms/public-license')

module.exports = function (request, response, service) {
  publicLicense({
    name: 'Example Licensor',
    jurisdiction: 'US-CA',
    publicKey: '_'.repeat(64),
    productID: '________-____-4___-____-____________',
    licensorID: '________-____-4___ ____-____________',
    grace: '____'
  }, function (error, document) {
    if (error) {
      service.log.error(error)
      return internalError(response, error)
    }
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
      <pre class=license>${escape(document)}</pre>
    </main>
    ${footer()}
  </body>
</html>
    `)
  })
}
