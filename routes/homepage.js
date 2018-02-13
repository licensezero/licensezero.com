var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var nav = require('./partials/nav')

var LICENSOR = [
  'npm install -g licensezero',
  '# Installs the License Zero command-line interface',
  'l0 identify "Anna Maintainer" US-TX anna@example.com',
  '# Configures the CLI for for Anna, a developer in Texas.',
  'l0 register',
  '# Provides a link to connect a Stripe account receive payments,',
  '# and an access token once the Stripe account is connected.',
  'l0 set-licensor-id $NEW_LICENSOR_UUID',
  '# Prompts for the new new licensor\'s access token, to save',
  '# for use offering projects for license.',
  'cd a-node-project',
  'l0 offer 500',
  '# Offer private licenses through licensezero.com at $5 US.',
  'l0 license --noncommercial $NEW_PROJECT_UUID',
  '# Writes LICENSE and package.json metadata for',
  '# `l0 quote` to read.',
  'git add LICENSE package.json',
  'git commit -m "License Zero"'
]

var LICENSEE = [
  'npm install -g licensezero',
  '# Installs the License Zero command-line interface.',
  'l0 identify "Larry Licensor" US-CA larry@example.com',
  '# Configures the CLI for Larry, a developer in California.',
  'cd a-node-project',
  'l0 quote',
  '# Lists License Zero dependencies in node_modules',
  '# and the costs of missing licenses.',
  'l0 buy',
  '# Opens an online order page for all needed licenses.',
  'l0 import-bundle $ORDER_BUNDLE_URL',
  '# Imports a bundle of licenses from the order page.'
]

var SPONSOR = [
  'npm install -g licensezero',
  '# Installs the License Zero command-line interface.',
  'l0 identify "Sam Sponsor" US-NY sam@example.com',
  '# Configures the CLI for Sam, a developer in New York.',
  'l0 sponsor $PROJECT_ID',
  '# Opens an online order page for sponsoring relicense',
  '# of a project onto License Zero Permissive terms.'
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
      Noncommercial users of <a href=/licenses/noncommercial>noncommercial</a> projects,
      and open source users of <a href=/licenses/reciprocal>reciprocal</a> projects,
      don&rsquo;t need any special permission to use License Zero
      software. For them, License Zero code works like open source under
      two-clause BSD, MIT, or a similarly permissive license.
    </p>
    <p>
      Users who want permission for commercial or non-open source
      uses can identify, price, and buy licenses for all License
      Zero dependencies of their Node.js projects, in one checkout
      transaction, using a free command-line tool:
    </p>
    <pre class=terminal>${formatSession(LICENSEE)}</pre>
    <h2>Sponsors</h2>
    <p>
      In a perfect world, making software wouldn&rsquo;t cost anything,
      and neither would using it, no strings attached.
      License Zero maintainers can offer to bring their software closer
      to that perfect world, by relicensing, for a fee, on permissive
      terms. Sponsors can accept those offers just like
      they can buy licenses:
    </p>
    <pre class=terminal>${formatSession(SPONSOR)}</pre>
    <h2>Developers</h2>
    <p>
      On the maintainer side, it&rsquo;s quick and easy to create,
      license, and price projects, with just a few short commands:
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
