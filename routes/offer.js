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
var readOffer = require('../data/read-offer')
var renderJurisdiction = require('./partials/jurisdiction')
var sanitizeOffer = require('../data/sanitize-offer')

module.exports = function (request, response) {
  var offerID = request.parameters.offerID
  if (!UUID.test(offerID)) {
    var error = new Error()
    error.userMessage = 'invalid offer identifier'
    return notFound(request, response, error)
  }
  readOffer(offerID, function (error, offer) {
    if (error) return notFound(request, response, error)
    sanitizeOffer(offer)
    var licensor = offer.licensor
    var data = { offer, licensor }
    var customizationPath = path.join(
      __dirname, '..', 'customizations', offerID + '.html'
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
          var pricing = offer.pricing
          var rendered = compiled(
            {
              id: offerID,
              description: offer.description,
              url: offer.homepage,
              retracted: offer.retracted,
              name: last(licensor.name),
              jurisdiction: last(licensor.jurisdiction),
              email: last(licensor.email),
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
      var offer = data.offer
      response.end(html`
  <!doctype html>
  <html lang=EN>
    ${head(offerID, {
      title: licensor.name + '’s Offer',
      description: offer.description
    })}
    <body>
      ${nav()}
      ${header()}
      <main>
        <h2>Software</h2>
        <section>
          <dl>
            <dt>Description</dt>
            <dd class=description>${escape(offer.description)}</dd>
            <dt>Homepage</dt>
            <dd class=homepage>
              <a href="${escape(offer.homepage)}" target=_blank>
                ${escape(offer.homepage)}
              </a>
            </dd>
            <dt>Offer ID</dt>
            <dd>
              <code class=offerID>${escape(offerID)}</code>
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
        ${offer.retracted ? retracted() : priceList(offer)}
        ${orderForm(offer)}
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
<p>The licensor has retracted this offer.</p>
  `
}

function priceList (offer) {
  var pricing = offer.pricing
  var lock = offer.lock
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
  Private license pricing for this offer
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

function orderForm (offer) {
  return html`
<h3 id=buy>Buy a License</h3>
<form method=POST action=/buy>
  <input
      type=hidden
      name=offers[]
      value="${escape(offer.offerID)}">
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
