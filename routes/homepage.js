var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var nav = require('./partials/nav')

var LICENSOR = [
  'npm install -g licensezero',
  '# Installs the License Zero command-line interface',
  'l0-register-licensor adam@licensezero.com "Adam Maintainer" US-TX',
  '# Creates an identity for offering private licenses',
  '# for Adam, a developer in Texas.',
  '# Provides a link to connect a Stripe account for payments, and',
  '# an access token once the Stripe account is connected.',
  'l0-add-licensor $NEW_LICENSOR_UUID',
  '# Prompts for the new new licensor\'s access token, to save for use',
  '# offering projects for license.',
  'cd a-node-project',
  'l0-offer --solo 500 --team 1000 --company 10000 --enterprise 50000',
  '# Offer private licenses through licensezero.com at $5 for solo,',
  '# $10 for team, $100 for company, and $500 for enterprise.',
  'l0-license $NEW_PROJECT_UUID',
  '# Writes LICENSE and package.json metadata for l0-quote to read.',
  'git add LICENSE package.json',
  'git commit -m "License Zero"'
]

var LICENSEE = [
  'npm install -g licensezero',
  '# Installs the License Zero command-line interface.',
  'l0-create-licensee someco "SomeCo, Inc." US-CA team',
  '# Creates an identity, "someco", for a corporation in',
  '# California that needs team-tier licenses.',
  'cd a-node-project',
  'l0-quote someco',
  '# Lists License Zero dependencies in node_modules',
  '# and the costs of missing licenses.',
  'l0-buy someco',
  '# Opens an online order page for all needed licenses.',
  'l0-purchased $ORDER_BUNDLE_URL',
  '# Imports a bundle of purchased licenses from the order page.'
]

module.exports = function (request, response, service) {
  response.setHeader('Content-Type', 'text/html; charset=UTf-8')
  response.end(html`
<!doctype html>
<html lang=EN>
${head()}
<body>
  ${nav()}
  ${header()}
  <main>
    <p>
      License Zero is
      <a href=/licenses>license forms</a>,
      <a href=https://github.com/licensezero/>software tools</a>,
      and an Internet vending machine
      that software maintainers can use to offer
      <a href=/licenses/private-licenses>paid commercial use licenses</a>
      and
      <a href=/licenses/relicense>sponsored permissive relicensing</a>
      for software developed in the open.
    </p>
    <p>
      License Zero software is free to distribute, and free to use
      and modify for non-commercial purposes.  Business users can
      identify all the licenses they need for a Node.js project
      with a free tool, and buy them all through a single credit
      card checkout page.  License prices, less fees, go directly to
      developers&rsquo; accounts.
    </p>
    <p>
      <a href=/manifesto>Read more</a>
      about License Zero and what it means for software.
    </p>
    <h2>Customers</h2>
    <pre class=terminal>${formatSession(LICENSEE)}</pre>
    <h2>Maintainers</h2>
    <pre class=terminal>${formatSession(LICENSOR)}</pre>
  </main>
  ${footer()}
</body>
</html>
  `)
}

function formatSession (lines) {
  return lines
    .map(function (line) {
      if (line.startsWith('#')) {
        return '<span class=comment>' + escape(line) + '</span>'
      } else {
        return escape(line)
      }
    })
    .join('\n')
}
