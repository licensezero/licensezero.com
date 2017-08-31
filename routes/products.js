var JURISDICTIONS = require('../data/jurisdictions')
var TIERS = require('../data/private-license-tiers')
var UUID = new RegExp(require('../data/uuidv4-pattern'))
var capitalize = require('./capitalize')
var escape = require('../escape')
var footer = require('./partials/footer')
var formatPrice = require('./format-price')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var notFound = require('./not-found')
var readProduct = require('../data/read-product')
var sanitizeProduct = require('../data/sanitize-product')

module.exports = function (request, response, service) {
  var productID = request.parameters.productID
  if (!UUID.test(productID)) {
    var error = new Error()
    error.userMessage = 'invalid product identifier'
    return notFound(service, response, error)
  }
  readProduct(service, productID, function (error, product) {
    if (error) return notFound(service, response, error)
    sanitizeProduct(product)
    var licensor = product.licensor
    response.setHeader('Content-Type', 'text/html; charset=UTf-8')
    response.end(html`
<!doctype html>
<html lang=EN>
  ${head('Product ' + productID)}
  <body>
    ${header()}
    <main>
      <h2>Product ${escape(productID)}</h2>
      <section>
        <dl>
          <dt>Description</dt>
          <dd class=description>${escape(product.description)}</dd>
          <dt>Repository</dt>
          <dd class=repository>
            <a href="${escape(product.repository)}" target=_blank>
              ${escape(product.repository)}
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
        product.retracted
          ? retracted()
          : priceList(product.pricing)
      }
      ${orderForm(product)}
    </main>
    ${footer()}
  </body>
</html>
    `)
  })
}

function retracted () {
  return html`
<p>The licensor has retracted this product from public sale.</p>
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
</dl>
  `
}

function orderForm (product) {
  return html`
<h3>Order a License</h3>
<form method=POST action=/buy>
  <input
      type=hidden
      name=products[]
      value="${escape(product.productID)}">
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
