var JURISDICTIONS = require('licensezero-jurisdictions')
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
var last = require('../util/last')
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
              name: last(licensor.name),
              jurisdiction: last(licensor.jurisdiction),
              email: last(licensor.email),
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
        <h2>Software</h2>
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
            </dd>
          </dl>
        </section>
        <section>
          <h2>Contributor</h2>
          <dl>
            <dt>Name</dt>
            <dd>${escape(licensor.name)}</dd>
            <dt>Jurisdiction</dt>
            <dd>${renderJurisdiction(licensor.jurisdiction)}</dd>
          </dl>
        </section>
        <h3>Pricing</h3>
        ${project.retracted ? retracted() : priceList(project)}
        ${orderForm(project)}
      </main>
      ${footer()}
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
<form method=POST action=/buy>
  <input
      type=hidden
      name=projects[]
      value="${escape(project.projectID)}">
  <p>
    <label>
      Your Legal Name
      <input
        type=text
        name=licensee
        id=licensee
        required>
    </label>
  </p>
  <p>
    <label>
      Your Jurisdiction
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
      Your E-Mail
      <input
        type=email
        name=email
        id=email
        required>
    </label>
  </p>
  <button type=submit>Check Out</button>
</form>
  `
}
