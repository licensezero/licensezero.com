// TODO: application: service.stripe.application
// TODO: application_fee: (service.fee * results.length)
// TODO: POST /pay/{order}
// TODO: POST /pay/{order} error UI
// TODO: log [licensor name, jurisdiction, email, date accepted terms]

var TIERS = require('../data/private-license-tiers')
var UUIDV4 = require('../data/uuidv4-pattern')
var orderPath = require('../paths/order')
var capitalize = require('./capitalize')
var escape = require('./escape')
var formatPrice = require('./format-price')
var html = require('../html')
var internalError = require('./internal-error')
var readJSONFile = require('../data/read-json-file')

var ONE_DAY = 24 * 60 * 60 * 1000
var UUID_RE = new RegExp(UUIDV4)

module.exports = function (request, response, service) {
  if (request.method !== 'GET') {
    response.statusCode = 405
    response.end()
  } else {
    var orderID = request.parameters.order
    if (!UUID_RE.test(orderID)) {
      notFound(response)
    } else {
      var file = orderPath(service, orderID)
      readJSONFile(file, function (error, order) {
        if (error) {
          if (error.code === 'ENOENT') {
            notFound(response)
          } else {
            service.log.error(error)
            internalError(response)
          }
        } else if (expired(order.date)) {
          notFound(response)
        } else {
          response.setHeader('Content-Type', 'text/html')
          response.end(html`
<!doctype html>
<html lang=en>
<head>
  <meta charset=UTF-8>
  <title>License Zero | Buy Licenses</title>
  <link rel=stylesheet href=/normalize.css>
  <link rel=stylesheet href=/styles.css>
</head>
<body>
  <header>
    <h1>License Zero | Buy Licenses</h1>
  </header>
  <main>
  <section>
    <p>${escape(order.licensee)} [${escape(order.jurisdiction)}]</p>
  </section>
  <section>
    <table class=invoice>
      <thead>
        <tr>
          <th>License</th>
          <th>Price (USD)</th>
        </tr>
      </thead>
      <tbody>
      ${order.products.map(function (product) {
        return html`
          <tr>
            <td>
              <p><code>${escape(product.id)}</code></p>
              <p>
                <a
                  href="${escape(product.repository)}"
                  target=_blank
                  >${escape(truncate(product.repository, 30))}</a>
              </p>
              <p>
                ${escape(product.licensor.name)}
                [${escape(product.licensor.jurisdiction)}]
              </p>
              <p>
                ${escape(capitalize(order.tier))} License:
                ${order.tier === 'solo' ? 'one user' : TIERS[order.tier] + ' users'},
                perpetual,
                with upgrades
              </p>
            </td>
            <td class=price>
              ${escape(formatPrice(product.price))}
            </td>
          </tr>
        `
      })}
      </tbody>
      <tbody class=subtotal>
        <tr>
          <td>Subtotal:</td>
          <td class=price>${escape(formatPrice(order.subtotal))}</td>
        </tr>
        <tr>
          <td>Tax:</td>
          <td class=price>${escape(formatPrice(order.tax))}</td>
        </tr>
      </tbody>
      <tfoot class=total>
        <tr>
          <td>Total:</td>
          <td class=price>${escape(formatPrice(order.total))}</td>
        </tr>
      </tfoot>
    </table>
  </section>
  <form class=pay>
    <section id=payment>
      <h2>Credit Card Payment</h2>
      <div id=card></div>
      <div id=card-errors></div>
    </section>
    <section id=email>
      <input name=email type=email>
    </section>
    <section id=terms>
      <label>
        <input type=checkbox name=terms value=accepted required>
        Check this box to accept License Zero&rsquo;s
        <a href=/terms target=_blank>terms of service</a>.
      </label>
    </section>
    <input id=submitButton type=submit value="Buy Licenses">
  </form>
  <script src=https://js.stripe.com/v3/></script>
  <script src=/pay.js></script>
</main></body>
</html>
          `)
        }
      })
    }
  }
}

function expired (created) {
  return (new Date() - new Date(created)) > ONE_DAY
}

function notFound (response) {
  response.statusCode = 404
  response.setHeader('Content-Type', 'text/html')
  response.end(html`
<!doctype html>
<html lang=en>
<head>
  <meta charset=UTF-8>
  <title>License Zero | Buy Licenses<title>
  <link rel=stylesheet href=/normalize.css>
  <link rel=stylesheet href=/styles.css>
</head>
<body><main>
  <h1>Invalid or Expired Purchase</h2>
  <p>
    There is no active purchase at the link you reached.
  </p>
</main></body>
</html>
  `)
}

function truncate (string, length) {
  if (string.length <= length) {
    return string
  } else {
    return string.slice(0, length - 3) + '…'
  }
}
