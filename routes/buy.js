var UUIDV4 = require('../data/uuidv4-pattern')
var buyPath = require('../paths/buy')
var escape = require('./escape')
var fs = require('fs')
var html = require('../html')
var internalError = require('./internal-error')
var parseJSON = require('json-parse-errback')

var ONE_DAY = 24 * 60 * 60 * 1000

// TODO: application: service.stripe.application
// TODO: application_fee: (service.fee * results.length)

module.exports = function (request, response, service) {
  if (request.method !== 'GET') {
    response.statusCode = 405
    response.end()
  } else {
    var buy = request.parameters.buy
    if (!new RegExp(UUIDV4).test(buy)) {
      notFound(response)
    } else {
      fs.readFile(buyPath(buy), function (error, buffer) {
        if (error) {
          if (error.code === 'ENOENT') {
            notFound(response)
          } else {
            service.log.error(error)
            internalError(response)
          }
        } else {
          parseJSON(buffer, function (error, data) {
            if (error) {
              service.log.error(error)
              internalError(response)
            } else if (expired(data.date)) {
              notFound(response)
            } else {
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
  <h1>License Zero | Buy</h2>
  <h2>Licensee</h2>
  <p>${escape(data.licensee)}, ${escape(data.jurisdiction)}</p>
  <h2>Products</h2>
  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>Repository</th>
        <th>Licensor</th>
        <th>Jurisdiction</th>
        <th>Term</th>
        <th>Price</th>
      </tr>
    </thead>
    <tbody>
    ${data.products.map(function (product) {
      return html`
        <tr>
          <td>${escape(product.product)}</td>
          <td>
            <a
              href="${escape(product.repository)}"
              target=_blank
              >Link</a>
          </td>
          <td>${escape(product.licensor.name)}</td>
          <td>${escape(product.licensor.jurisdiction)}</td>
          <td>${escape(product.term)} calendar days</td>
          <td>${product.price.replace(/(\d\d)$/, '.$1')} USD</td>
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
  <script src=https://js.tripe.com/v3/></script>
  <script src=/buy.js></script>
</body>
</html>
              `)
            }
          })
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
