var JURISDICTIONS = require('licensezero-jurisdictions')
var PERSON = require('./actions/common/person').const
var UUID = new RegExp(require('../data/uuidv4-pattern'))
var escape = require('./escape')
var footer = require('./partials/footer')
var formatPrice = require('./format-price')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var nav = require('./partials/nav')
var notFound = require('./not-found')
var readProject = require('../data/read-project')
var sanitizeProject = require('../data/sanitize-project')

module.exports = function (request, response, service) {
  var projectID = request.parameters.projectID
  if (!UUID.test(projectID)) {
    var error = new Error()
    error.userMessage = 'invalid project identifier'
    return notFound(service, response, error)
  }
  readProject(service, projectID, function (error, project) {
    if (error) return notFound(service, response, error)
    sanitizeProject(project)
    var licensor = project.licensor
    response.setHeader('Content-Type', 'text/html; charset=UTf-8')
    response.end(html`
<!doctype html>
<html lang=EN>
  ${head('Project ' + projectID)}
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
            <code>${escape(projectID)}</code>
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
          <dd>${escape(licensor.jurisdiction)}</dd>
          <dt>Public Signing Key</dt>
          <dd>
            <pre><code>${
              licensor.publicKey.slice(0, 32) + '\n' +
              licensor.publicKey.slice(32)
            }</code></pre>
            <button class=clipboard data-clipboard-text="${escape(licensor.publicKey)}">Copy to Clipboard</button>
          </dd>
        </dl>
      </section>
      <h3>Pricing</h3>
      ${
        project.retracted
          ? retracted()
          : priceList(project)
      }
      ${orderForm(project)}
    </main>
    ${footer()}
    <script src=/clipboard.min.js></script>
    <script>new ClipboardJS('.clipboard')</script>
  </body>
</html>
    `)
  })
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
  <dt>Private License</dt>
  <dd>
    ${formatPrice(pricing.private)}
    ${currentlyLocked() && lockInformation(lock)}
  </dd>
${
  pricing.relicense && html`
    <dt>Relicense</dt>
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
<h3>Order a License</h3>
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
      <select name=jurisdiction id=jurisdiction>
        ${JURISDICTIONS.map(function (code) {
          return html`
            <option value="${escape(code)}">
              ${escape(code)}
            </option>
          `
        })}
      </select>
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
  <button type=submit>Order</button>
</form>
  `
}
