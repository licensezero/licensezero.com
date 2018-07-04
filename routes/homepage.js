var INSTALL = require('../one-line-install.json')
var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var nav = require('./partials/nav')

var LICENSOR = [
  '# Set up for Anna, a developer in Texas.',
  'licensezero identify --name "Anna Maintainer" \\',
  '  --jurisdiction US-TX --email anna@example.com',
  '# Open a page to connect a Stripe account to receive payments',
  '# and receive an access token.',
  'licensezero register',
  '# Save the access token for use sending commands.',
  'licensezero token --licensor $ANNAS_NEW_LICENSOR_ID',
  '# Offer private licenses through licensezero.com at $5 US.',
  'cd a-software-package',
  'licensezero offer --price 500 --relicense 500000 \\',
  '  --homepage http://example.com --description "an example project"',
  '# Write The Prosperity License to LICENSE and metadata for',
  '# `licensezero quote` to read to `licensezero.json`.',
  'licensezero license --id -$ANNAS_NEW_ID -prosperity ',
  '# Commit and push the changes.',
  'git add LICENSE licensezero.json',
  'git commit -m "License Zero"',
  'git push'
]

var LICENSEE = [
  '# Set up for Larry, a developer in California.',
  'licensezero identify --name "Larry Licensor" \\',
  '  --jurisdiction US-CA --email larry@example.com',
  '# List License Zero dependencies and the cost of',
  '# all missing licenses.',
  'cd a-software-project',
  'licensezero quote',
  '# Open an order page for all needed licenses.',
  '# Proceeds go straight to developers\' Stripe accounts.',
  'licensezero buy',
  '# Import a bundle with all licenses purchased.',
  'licensezero import --bundle $ORDER_BUNDLE_URL',
  '# Show there are no more missing licenses.',
  'licensezero quote'
]

var SPONSOR = [
  '# Set up for Sam, a developer in New York.',
  'licensezero identify --name "Sam Sponsor" \\',
  '  --jurisdiction US-NY --email sam@example.com',
  '# Open an order page for sponsorship.',
  'licensezero sponsor --id $ID'
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
    <p class=lead>
      License Zero is a new way to support open software developers.
    </p>
    <p>
      Contributors can choose from two new licenses that make their work
      free for noncommercial or open-source users, then sell private
      licenses to other devs who want to use commercially or in
      closed source.  Everything happens through a simple, dev-friendly
      interface.
    </p>
    <h2 id=install>Install</h2>
    <a class=download href=https://github.com/licensezero/cli/releases/latest target=_blank>Download the <code>licensezero</code> command</a>
    <p>or install on the command line:</p>
    <pre class=terminal>${INSTALL}</pre>
    <p>You can <a href=https://github.com/licensezero/cli/blob/master/install.sh>review the short script</a> before running it.</p>

    <h2 id=users>Users</h2>
    <p>
      Noncommercial users of <a href=/licenses/prosperity>Prosperity</a>-licensed projects,
      and open source users of <a href=/licenses/parity>Parity</a>-licensed projects,
      don&rsquo;t need any special permission to use the
      software.  For them, the licenses work much like
      the two-clause BSD, MIT, or another classic permissive license.
    </p>
    <p>
      Users who want permission for commercial or closed, proprietary
      uses can identify, price, and buy licenses for all License
      Zero dependencies of software projects in
      <a href=https://github.com/licensezero/cli/blob/master/LANGUAGES.md
        >variety of languages</a>,
      in one checkout transaction, using
      <a href=https://github.com/licensezero/cli>a free command-line tool</a>:
    </p>
    <pre class=terminal>${formatSession(LICENSEE)}</pre>
    <h2>Sponsors</h2>
    <p>
      In a perfect world, making software wouldn&rsquo;t cost anything,
      and neither would using it, no strings attached.
      License Zero developers can offer to bring their software closer
      to that perfect world, by relicensing, for a fee, on permissive
      terms. Sponsors can accept those offers:
    </p>
    <pre class=terminal>${formatSession(SPONSOR)}</pre>
    <h2>Contributors</h2>
    <p>
      On the contributor side, it&rsquo;s quick and easy to create,
      license, and price projects:
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
      } else {
        return escape(line)
      }
    })
    .join('\n')
}
