var INSTALL = require('../one-line-install.json')
var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var nav = require('./partials/nav')

var LICENSOR = [
  '# Set up for Anna, a developer in Texas.',
  '# You only need to do this once.',
  'licensezero identify --name "Anna Maintainer" \\',
  '  --jurisdiction US-TX --email anna@example.com',
  '',
  '# Open a page to connect a Stripe account to receive payments',
  '# and receive an access token.',
  'licensezero register',
  '',
  '# Save the access token for use sending commands.',
  'licensezero token --licensor $ANNAS_NEW_LICENSOR_ID',
  '',
  '# Offer private licenses through licensezero.com at $5 US.',
  'licensezero offer --price 500 --relicense 500000 \\',
  '  --homepage http://example.com --description "an example project"',
  '',
  '# Write Prosperity to LICENSE and metadata to `licensezero.json`.',
  'cd a-software-package',
  'licensezero license --id -$ANNAS_NEW_ID --prosperity ',
  '',
  '# Commit and push the changes.',
  'git add LICENSE licensezero.json',
  'git commit -m "License Zero"',
  'git push'
]

var LICENSEE = [
  '# Set up for Larry, a developer in California.',
  '# You only need to do this once.',
  'licensezero identify --name "Larry Licensor" \\',
  '  --jurisdiction US-CA --email larry@example.com',
  '',
  '# List License Zero dependencies and the cost of',
  '# all missing licenses.',
  'cd a-software-project',
  'licensezero quote',
  '',
  '# Open an order page for all needed licenses.',
  'licensezero buy',
  '',
  '# Import a bundle with all licenses purchased.',
  'licensezero import --bundle $ORDER_BUNDLE_URL',
  '',
  '# Check that there are no more missing licenses.',
  'licensezero quote'
]

/*
var SPONSOR = [
  '# Set up for Sam, a developer in New York.',
  '# You only need to do this once.',
  'licensezero identify --name "Sam Sponsor" \\',
  '  --jurisdiction US-NY --email sam@example.com',
  '',
  '# Open an order page.',
  'licensezero sponsor --id $ID'
]
*/

module.exports = function (request, response) {
  response.setHeader('Content-Type', 'text/html; charset=UTf-8')
  response.end(html`
<!doctype html>
<html lang=EN>
${head(false, {
  title: 'License Zero',
  description: 'gainful software in the open'
})}
<body>
  ${nav()}
  ${header()}
  <main>
    <p class=lead>
      License Zero is a new way to support open software developers.
    </p>
    <p>
      Contributors can choose from two new licenses,
      <a href=/licenses/parity>Parity</a> and
      <a href=/licenses/prosperity>Prosperity</a>,
      that make their work
      free for not-for-profit or open-source users, then sell private
      licenses to other devs who want to use for profit or in
      closed source.  Everything happens through a simple, dev-friendly
      interface.
    </p>
    <img class=explainer alt="An explainer graphic with a row for Parity and for Prosperity, with open and locked doors for for-profit user, open source, and closed source" src=/doors.svg>
    <p>
      licensezero.com works like a vending machine. Developers stock
      licensezero.com with licenses for for-profit and closed-source work.
      licensezero.com sells those licenses to users on developers’
      behalf, and sends the proceeds directly to developers’
      <a href=https://www.stripe.com>Stripe</a> accounts.
    </p>
    <p class=lead>
      The <code>licensezero</code> command makes it easy for everyone.
    </p>
    <p class=download>
      <a id=install href=https://github.com/licensezero/cli/releases/latest target=_blank>Download the <code>licensezero</code> command</a>
      or install on the command line:
    </p>
    <pre class=terminal>${INSTALL}</pre>
    <h2 id=users>Users</h2>
    <p>
      You can automatically identify, price, and buy all the licenses you need for
      your project:
    </p>
    <pre class=terminal>${formatSession(LICENSEE)}</pre>
    <p>
      Users can also buy specific licenses
      <a href=https://licensezero.com/ids/6d3f67d4-af32-4959-abe3-dacd765484f3#buy>on licensezero.com</a>.
    </p>
    <h2>Developers</h2>
    <p>
      Offering licenses through License Zero is quick and easy:
    </p>
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
      }
      return escape(line)
    })
    .join('\n')
}
