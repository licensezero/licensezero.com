var JURISDICTIONS = require('licensezero-jurisdictions')
var TIERS = require('../data/private-license-tiers')
var UUID = new RegExp(require('../data/uuidv4-pattern'))
var capitalize = require('./capitalize')
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
      <h2>Project ${escape(projectID)}</h2>
      <section>
        <dl>
          <dt>Description</dt>
          <dd class=description>${escape(project.description)}</dd>
          <dt>Repository</dt>
          <dd class=repository>
            <a href="${escape(project.repository)}" target=_blank>
              ${escape(project.repository)}
            </a>
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
          <dd><pre><code>${
            licensor.publicKey.slice(0, 32) + '\n' +
            licensor.publicKey.slice(32)
          }</code></pre></dd>
        </dl>
      </section>
      <h3>Pricing</h3>
      ${
        project.retracted
          ? retracted()
          : priceList(project.pricing)
      }
      ${orderForm(project)}
    </main>
    ${footer()}
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

function priceList (pricing) {
  return html`
<dl>
${
  Object.keys(TIERS).map(function (tier) {
    return html`
      <dt>${capitalize(tier)}</dt>
      <dd>${formatPrice(pricing[tier])}</dd>
    `
  })
}
${
  pricing.relicense && html`
    <dt>Relicense</dt>
    <dd>${formatPrice(pricing.relicense)}</dd>
  `
}
</dl>
  `
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
      License Tier
      <select name=tier id=tier>
        ${Object.keys(TIERS).map(function (tier) {
          return html`
            <option value="${escape(tier)}">
              ${escape(capitalize(tier))}
            </option>
          `
        })}
      </select>
    </label>
  </p>
  <button type=submit>Order</button>
</form>
  `
}
