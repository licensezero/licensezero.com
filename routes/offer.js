var JURISDICTIONS = require('licensezero-jurisdictions')
var PERSON = require('./actions/common/person').const
var UUID = new RegExp(require('../data/uuidv4-pattern'))
var escape = require('./escape')
var footer = require('./partials/footer')
var formatPrice = require('../util/format-price')
var fs = require('fs')
var handlebars = require('handlebars')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var iso31662 = require('iso-3166-2')
var jurisdictionOptions = require('./partials/jurisdiction-options')
var nav = require('./partials/nav')
var notFound = require('./not-found')
var path = require('path')
var readProject = require('../data/read-project')
var renderJurisdiction = require('./partials/jurisdiction')
var sanitizeProject = require('../data/sanitize-project')

module.exports = function (request, response) {
  var projectID = request.parameters.projectID
  if (!UUID.test(projectID)) {
    var error = new Error()
    error.userMessage = 'invalid project identifier'
    return notFound(request, response, error)
  }
  readProject(projectID, function (error, project) {
    if (error) return notFound(request, response, error)
    sanitizeProject(project)
    var licensor = project.licensor
    licensor.jurisdiction = renderJurisdiction(licensor.jurisdiction)
    var data = { project, licensor }
    var customizationPath = path.join(
      __dirname, '..', 'customizations', projectID + '.html'
    )
    fs.readFile(
      customizationPath, 'utf8',
      function (error, template) {
        if (error) {
          if (error.code === 'ENOENT') return sendHTML(data)
          return internalError(request, response, error)
        }
        if (template.length === 0) {
          return internalError(request, response, error)
        }
        var compiled = handlebars.compile(template)
        response.setHeader('Content-Type', 'text/html; charset=UTf-8')
        try {
          data.jurisdictions = JURISDICTIONS.map(function (code) {
            var parsed = iso31662.subdivision(code)
            return {
              country: parsed.countryName,
              subdivision: parsed.name,
              code
            }
          })
          var pricing = project.pricing
          var rendered = compiled(
            {
              id: projectID,
              description: project.description,
              url: project.homepage,
              retracted: project.retracted,
              name: licensor.name,
              jurisdiction: licensor.jurisdiction,
              publicKey: licensor.publicKey,
              private: pricing.private,
              relicense: pricing.relicense,
              lock: pricing.lock
            },
            { renderJurisdiction, formatDate, formatPrice }
          )
        } catch (error) {
          return internalError(request, response, error)
        }
        sendHTML({ customized: rendered })
      }
    )
  })

  function sendHTML (data) {
    response.setHeader('Content-Type', 'text/html; charset=UTf-8')
    if (data.customized) {
      response.end(data.customized)
    } else {
      var licensor = data.licensor
      var project = data.project
      response.end(html`
  <!doctype html>
  <html lang=EN>
    ${head(projectID, {
      title: licensor.name + '’s Project',
      description: project.description
    })}
    <body>
      ${nav()}
      ${header()}
      <main>
        <h2>Project</h2>
        <section>
          <dl>
            <dt>Description</dt>
            <dd class=description>${escape(project.description)}</dd>
            <dt>Homepage</dt>
            <dd class=homepage>
              <a href="${escape(project.homepage)}" target=_blank>
                ${escape(project.homepage)}
              </a>
            </dd>
            <dt>Project ID</dt>
            <dd>
              <code class=projectID>${escape(projectID)}</code>
              <button class=clipboard data-clipboard-text="${escape(projectID)}">Copy to Clipboard</button>
            </dd>
          </dl>
        </section>
        <section>
          <h3>Licensor</h3>
          <dl>
            <dt>Name</dt>
            <dd>${escape(licensor.name)}</dd>
            <dt>Jurisdiction</dt>
            <dd>${renderJurisdiction(licensor.jurisdiction)}</dd>
            <dt>Public Signing Key</dt>
            <dd>
              <pre><code>${licensor.publicKey.slice(0, 32) + '\n' + licensor.publicKey.slice(32)}</code></pre>
              <button class=clipboard data-clipboard-text="${escape(licensor.publicKey)}">Copy to Clipboard</button>
            </dd>
          </dl>
        </section>
        <h3>Pricing</h3>
        ${project.retracted ? retracted() : priceList(project)}
        ${orderForm(project)}
      </main>
      ${footer()}
      <script src=/clipboard.min.js></script>
      <script>new ClipboardJS('.clipboard')</script>
    </body>
  </html>
      `)
    }
  }
}

function retracted () {
  return html`
<p>The licensor has retracted this project from public sale.</p>
  `
}

function priceList (project) {
  var pricing = project.pricing
  var lock = project.lock
  return html`
<dl>
  <dt>
    <a href=/licenses/private>Private License</a>
    for a single commercial user or proprietary developer
  </dt>
  <dd>
    ${formatPrice(pricing.private)}
    ${currentlyLocked() && lockInformation(lock)}
  </dd>
${
  pricing.relicense && html`
    <dt>
      <a href=/licenses/relicense>Relicense</a>
      onto
      <a href=/licenses/permissive>permissive public terms</a>
    </dt>
    <dd>${formatPrice(pricing.relicense)}</dd>
  `
}
</dl>
  `
  function currentlyLocked () {
    if (!lock) return false
    var unlock = new Date(lock.unlock)
    var now = new Date()
    return unlock > now
  }
}

function lockInformation (lock) {
  return html`
<p>
  Private license pricing for this project
  was locked at
  ${formatPrice(lock.price)} or less
  until ${formatDate(lock.unlock)}
  on ${formatDate(lock.locked)}.
</p>
  `
}

function formatDate (dateString) {
  return new Date(dateString)
    .toLocaleString({
      timeZone: 'UTC',
      timeZoneName: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })
}

function orderForm (project) {
  return html`
<h3 id=buy>Buy a License</h3>
<p>
  You can order licenses for all the projects you need at one time with the
  <a href=https://github.com/licensezero/cli>
    License Zero command-line tool
  </a>:
</p>
<pre class=terminal>cd your-project
<span class=comment># If you haven't already:</span>
licensezero identify \\
  --name "Sara Smart" \\
  --jurisdiction "US-CA" \\
  --email "sara@example.com"
<span class=comment># Open a checkout page for all missing licenses:</span>
licensezero buy</pre>
<p>
  You can also buy a license for just this project right here:
</p>
<form method=POST action=/buy>
  <input
      type=hidden
      name=projects[]
      value="${escape(project.projectID)}">
  <p>
    <label>
      Licensee Legal Name
      <input
        type=text
        name=licensee
        id=licensee
        required>
    </label>
  </p>
  <p>
    <label>
      Licensee Jurisdiction
      <input
        id=jurisdiction
        name=jurisdiction
        type=text
        list=jurisdictions
        autocomplete=off
        required>
      <datalist id=jurisdictions>
        ${jurisdictionOptions()}
      </datalist>
    </label>
  </p>
  <p>
    <label>
      Licensee E-Mail
      <input
        type=email
        name=email
        id=email
        required>
    </label>
  </p>
  <p>
    <label>
      <input
        type=checkbox
        name=person
        id=person
        value="${PERSON}"
        required>
      ${escape(PERSON)}
    </label>
  </p>
  <button type=submit>Buy</button>
</form>
  `
}
