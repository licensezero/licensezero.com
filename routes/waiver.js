var escape = require('../escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var waiver = require('../forms/waiver')

module.exports = function (request, response, service) {
  response.setHeader('Content-Type', 'text/html')
  response.end(html`
<!doctype html>
<html>
  ${head()}
  <body>
    ${header()}
    <main>
      <h2>Example Waiver</h2>
      <p>
        License Zero permits licensors to waive the
        condition of the
        <a href=/forms/public-license>License Zero Public License</a>
        limiting commercial use for specific beneficiaries,
        using a standard form waiver.
      </p>
      <h2>For a Term</h2>
      <pre class=license>${escape(waiver({
        beneficiary: 'Example Beneficiary',
        name: 'Example Licensor',
        jurisdiction: 'US-CA',
        productID: 'XXXXXXXX-XXXX-4XXX-XXXX-XXXXXXXXXXXX',
        description: 'a fake product to demonstrate license terms',
        repository: 'https://licensezero.com/forms/private-license',
        term: 365,
        grace: 180,
        date: '2017-09-01T12:00:00.000Z'
      }))}</pre>
      <h2>Forever</h2>
      <pre class=license>${escape(waiver({
        beneficiary: 'Example Beneficiary',
        name: 'Example Licensor',
        term: 'forever',
        jurisdiction: 'US-CA',
        productID: 'XXXXXXXX-XXXX-4XXX-XXXX-XXXXXXXXXXXX',
        description: 'a fake product to demonstrate license terms',
        repository: 'https://licensezero.com/forms/private-license',
        grace: 180,
        date: '2017-09-01T12:00:00.000Z'
      }))}</pre>
    </main>
    ${footer()}
  </body>
</html>
  `)
}
