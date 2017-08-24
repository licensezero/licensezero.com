// TODO: application: service.stripe.application
// TODO: application_fee: (service.fee * results.length)
// TODO: POST /pay/{order}
// TODO: POST /pay/{order} error UI

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
  <title>License Zero | Buy</title>
  <link rel=stylesheet href=/styles.css>
</head>
<body>
  <h1>License Zero | Buy</h1>
  <h2>Licensee</h2>
  <p>${escape(order.licensee)} [${escape(order.jurisdiction)}]</p>
  <p>
    ${escape(capitalize(order.tier))}:
    ${order.tier === 'solo' ? 'one user' : TIERS[order.tier] + ' users'}
  </p>
  <h2>Products</h2>
  <table id=products>
    <thead>
      <tr>
        <th>Licensor</th>
        <th>Product</th>
        <th>Repository</th>
        <th>Price</th>
      </tr>
    </thead>
    <tbody>
    ${order.products.map(function (product) {
      return html`
        <tr>
          <td>
            ${escape(product.licensor.name)}
            [${escape(product.licensor.jurisdiction)}]
          </td>
          <td>${escape(product.id)}</td>
          <td>
            <a
              href="${escape(product.repository)}"
              target=_blank
              >Link</a>
          </td>
          <td>${formatPrice(product.pricing[order.tier])}</td>
        </tr>
      `
    })}
    </tbody>
  </table>
  <form>
    <section id=payment>
      <h3>Credit Card Payment</h3>
      <div id=card></div>
      <div id=card-errors></div>
    </section>
    <section id=email>
      <h2>E-Mail</h2>
      <input name=email type=email>
    </section>
    <section id=terms>
      <h2>Terms of Service</h2>
      <label>
        <input type=checkbox name=terms value=accepted required>
        Check this box to accept License Zero&rsquo;s terms of service.
      </label>
      <p>
        <a href=/terms target=_blank>Click here</a> to read the terms.
      </p>
    </section>
    <input id=submitButton type=submit value=Buy>
  </form>
  <script src=https://js.stripe.com/v3/></script>
  <script src=/pay.js></script>
</body>
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
  <title>License Zero | Buy<title>
  <link rel=stylesheet href=/styles.css>
</head>
<body>
  <h1>Invalid or Expired Purchase</h2>
  <p>
    There is no active purchase at the link you reached.
  </p>
</body>
</html>
  `)
}
