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
  'cd an-npm-package',
  'licensezero offer --price 500 --relicense 500000 \\',
  '  --homepage http://example.com --description "an example project"',
  '# Write The Prosperity License to LICENSE and metadata for',
  '# `licensezero quote` to read to `package.json`.',
  'licensezero license --prosperity $ANNAS_NEW_PROJECT_ID',
  '# Commit and push the changes.',
  'git add LICENSE package.json',
  'git commit -m "License Zero"',
  'git push'
]

var LICENSEE = [
  '# Set up for Larry, a developer in California.',
  'licensezero identify --name "Larry Licensor" \\',
  '  --jurisdiction US-CA --email larry@example.com',
  '# List License Zero dependencies in node_modules',
  '# and the cost of all missing licenses.',
  'cd a-node-project',
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
  '# Open an order page for sponsorship',
  '# of a project, relicensing is on permissive terms.',
  'licensezero sponsor --project $PROJECT_ID'
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
      Developers can choose from two new licenses that make their work
      free for noncommercial or open-source users, then sell private
      licenses to other devs who want to use commercially or in
      closed source.  Everything happens through a simple, dev-friendly
      interface.
    </p>
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
      Zero dependencies of their Node.js projects, in one checkout
      transaction, using
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
    <h2>Developers</h2>
    <p>
      On the developer side, it&rsquo;s quick and easy to create,
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
