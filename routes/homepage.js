var escape = require('./escape')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var nav = require('./partials/nav')

var LICENSOR = [
  'npm install -g licensezero',
  '# Installs the License Zero command-line interface',
  'licensezero identify adam@licensezero.com "Adam Maintainer" US-TX',
  '# Configures the CLI for for Adam, a developer in Texas.',
  'licensezero register',
  '# Provides a link to connect a Stripe account receive payments, and',
  '# an access token once the Stripe account is connected.',
  'licensezero set-licensor-id $NEW_LICENSOR_UUID',
  '# Prompts for the new new licensor\'s access token, to save for use',
  '# offering projects for license.',
  'cd a-node-project',
  'licensezero offer 500',
  '# Offer private licenses through licensezero.com at $5 US.',
  'licensezero license --noncommercial $NEW_PROJECT_UUID',
  '# Writes LICENSE and package.json metadata for licensezero quote to read.',
  'git add LICENSE package.json',
  'git commit -m "License Zero"'
]

var LICENSEE = [
  'npm install -g licensezero',
  '# Installs the License Zero command-line interface.',
  'licensezero identify "Larry Licensor" US-CA larry@example.com',
  '# Configures the CLI for Larry, a developer in California.',
  'cd a-node-project',
  'licensezero quote',
  '# Lists License Zero dependencies in node_modules',
  '# and the costs of missing licenses.',
  'licensezero buy',
  '# Opens an online order page for all needed licenses.',
  'licensezero import-bundle $ORDER_BUNDLE_URL',
  '# Imports a bundle of licenses from the order page.'
]

var SPONSOR = [
  'npm install -g licensezero',
  '# Installs the License Zero command-line interface.',
  'licensezero identify "Sam Sponsor" US-NY sam@example.com',
  '# Configures the CLI for Sam, a developer in New York.',
  'licensezero sponsor $PROJECT_ID',
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
      License Zero is a shot across the bow of Open Source software
      entitlement, free-as-in-worthless, and maintainer disposability.
    </p>
    <p>
      Feel overwhelmed by business-driven demand for open software,
      maintenance, and support?  License Zero offers
      all the
      <a href=https://github.com/licensezero/licensezero-cli>tools</a>
      <a href=/licenses>you<a/>
      <a href=/terms>need</a>
      to go in business yourself,
      and start receiving compensation for your contributions.
    </p>
    <p>
      Tired of seeing your open code end up in closed systems, with no
      contribution or support flowing back?
      License Zero
      <a href=/licenses/reciprocal>puts the teeth back in copyleft</a>,
      requiring community members to give back to Open Source or support
      those who do.
    </p>
    <p>
      Want a simple, low-friction way to support maintainers of open
      code you use and rely on, when you can&rsquo;t give back in kind?
      License Zero makes it easy,
      <a href=#users>right from the command line</a>.
    </p>
    <h2 id=users>Users</h2>
    <p>
      Noncommercial users of <a href=/licenses/noncommercial>noncommercial</a> projects,
      and Open Source users of <a href=/licenses/reciprocal>reciprocal</a> projects,
      don&rsquo;t need any special permission to use License Zero
      software. For them, License Zero code works like Open Source under
      two-clause BSD, MIT, or a similarly permissive license.
    </p>
    <p>
      Customers who want permission for commercial or non-Open Source
      uses can identify, price, and buy licenses for all License
      Zero dependencies of their Node.js projects, in one checkout
      transaction, using a free command-line tool:
    </p>
    <pre class=terminal>${formatSession(LICENSEE)}</pre>
    <h2>Sponsors</h2>
    <p>
      In a perfect world, making software wouldn&rsquo;t cost anything,
      and neither would using it, no strings attached.
    </p>
    <p>
      License Zero maintainers can offer to bring their software closer
      to that perfect world, by relicensing, for a fee, on permissive
      terms. Sponsors can accept those offers just like
      they can buy licenses:
    </p>
    <pre class=terminal>${formatSession(SPONSOR)}</pre>
    <h2>Maintainers</h2>
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
