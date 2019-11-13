var PERSON = require('./actions/common/person').const
var UUID = new RegExp(require('../data/uuidv4-pattern'))
var escape = require('./escape')
var footer = require('./partials/footer')
var formatPrice = require('../util/format-price')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var jurisdictionOptions = require('./partials/jurisdiction-options')
var nav = require('./partials/nav')
var notFound = require('./not-found')
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
    response.setHeader('Content-Type', 'text/html; charset=UTf-8')
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
      <h2>Offer</h2>
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
            <button class=clipboard data-clipboard-text="${escape(offerID)}">Copy to Clipboard</button>
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
  offer.retracted
    ? retracted()
    : priceList(offer)
}
      ${orderForm(offer)}
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
<p>The licensor has retracted this offer from public sale.</p>
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
<p>
  You can order licenses for all the offers you need at one time with the
  <a href=https://github.com/licensezero/cli>
    License Zero command-line tool
  </a>:
</p>
<pre class=terminal>cd your-offer
<span class=comment># If you haven't already:</span>
licensezero identify \\
  --name "Sara Smart" \\
  --jurisdiction "US-CA" \\
  --email "sara@example.com"
<span class=comment># Open a checkout page for all missing licenses:</span>
licensezero buy</pre>
<p>
  You can also buy a license for just this offer right here:
</p>
<form method=POST action=/buy>
  <input
      type=hidden
      name=offers[]
      value="${escape(offer.offerID)}">
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
