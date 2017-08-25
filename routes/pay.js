// TODO: POST /pay/{order}
// TODO: POST /pay/{order} error UI

var AJV = require('ajv')
var Busboy = require('busboy')
var TIERS = require('../data/private-license-tiers')
var UUIDV4 = require('../data/uuidv4-pattern')
var capitalize = require('./capitalize')
var decode = require('../data/decode')
var ecb = require('ecb')
var ed25519 = require('ed25519')
var encode = require('../data/encode')
var escape = require('./escape')
var formatPrice = require('./format-price')
var html = require('../html')
var internalError = require('./internal-error')
var orderPath = require('../paths/order')
var pick = require('../data/pick')
var privateLicense = require('../forms/private-license')
var readJSONFile = require('../data/read-json-file')
var recordAcceptance = require('../data/record-acceptance')
var recordSignature = require('../data/record-signature')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var runWaterfall = require('run-waterfall')

var ONE_DAY = 24 * 60 * 60 * 1000
var UUID_RE = new RegExp(UUIDV4)

module.exports = function (request, response, service) {
  var method = request.method
  if (method === 'GET' || method === 'POST') {
    var orderID = request.parameters.order
    if (!UUID_RE.test(orderID)) return notFound(response)
    var file = orderPath(service, orderID)
    readJSONFile(file, function (error, order) {
      if (error) {
        if (error.code === 'ENOENT') return notFound(response)
        service.log.error(error)
        internalError(response)
      } else if (expired(order.date)) {
        return notFound(response)
      }
      (method === 'GET' ? get : post)(request, response, service, order)
    })
  } else {
    response.statusCode = 405
    response.end()
  }
}

function get (request, response, service, order) {
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
                ${
                  order.tier === 'solo'
                    ? 'one user'
                    : TIERS[order.tier] + ' users'
                },
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
  <form class=pay method=post action=/pay/${order.id}>
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

var postSchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email'
    },
    terms: {
      const: 'accepted'
    },
    token: {
      type: 'string',
      pattern: '^tok_'
    }
  },
  required: ['email', 'terms', 'token'],
  additionalProperties: false
}

var ajv = new AJV()
var validatePost = ajv.compile(postSchema)

function post (request, response, service, order) {
  var data = {}
  var parser = new Busboy({headers: request.headers})
  parser.on('field', function (name, value) {
    if (Object.keys(postSchema.properties).includes(name)) {
      data[name] = value
    }
  })
  parser.once('finish', function () {
    if (!validatePost(data)) {
      response.statusCode = 400
      return response.end()
    }
    var products = order.products
    runParallel(
      [
        recordAcceptance.bind(null, service, {
          licensee: order.licensee,
          jurisdiction: order.jurisdiction,
          email: order.email,
          date: new Date().toISOString()
        })
      ].concat(products.map(function (product) {
        return function (done) {
          runSeries([
            function chargeCustomer (done) {
              service.stripe.api.charges.create({
                amount: product.price + product.tax,
                currency: 'usd',
                source: data.token,
                application_fee: service.fee
              }, {
                stripe_account: product.licensor.stripe.id
              }, done)
            },
            function (done) {
              runWaterfall([
                function emaiLicense (done) {
                  var document = privateLicense({
                    date: new Date().toISOString(),
                    tier: order.tier,
                    product: pick(product, ['id', 'repository']),
                    licensee: {
                      name: order.licensee,
                      jurisdiction: order.jurisdiction
                    },
                    licensor: pick(product.licensor, [
                      'id', 'name', 'jurisdiction', 'publicKey'
                    ])
                  })
                  var license = {
                    productID: product.id,
                    document: document,
                    publicKey: product.licensor.publicKey,
                    signature: encode(
                      ed25519.Sign(
                        Buffer.from(document, 'ascii'),
                        decode(product.licensor.privateKey)
                      )
                    )
                  }
                  service.email({
                    to: data.email,
                    subject: 'License Zero License File',
                    text: []
                      .concat(
                        'Attached is a License Zero license file for:'
                      )
                      .concat([
                        'Licensee: ' + order.licenseed,
                        'Jurisdiction: ' + order.jurisdiction,
                        'Product:      ' + product.id,
                        'Repository:   ' + product.repository,
                        'License Tier: ' + capitalize(order.tier)
                      ].join('\n')),
                    license: license
                  }, ecb(done, function () {
                    done(null, license)
                  }))
                },
                function (license, done) {
                  recordSignature(
                    service, license.publicKey, license.signature, done
                  )
                }
              ], done)
            }
          ], done)
        }
      })),
    function (error) {
      if (error) {
        service.log.error(error)
        response.statusCode = 500
        response.setHeader('Content-Type', 'text/html')
        response.end(html`
<!doctype html>
<html lang=en>
<head>
  <meta charset=UTF-8>
  <title>License Zero | Technical Error</title>
  <link rel=stylesheet href=/normalize.css>
  <link rel=stylesheet href=/styles.css>
</head>
<body>
  <header><h1>Technical Error</h1></header>
  <main>
    <p>
      One or more of your license purchases
      failed to go through, due to a technical error.
    </p>
    <p>
      Please check your e-mail for purchases
      that completed successfully.
    </p>
  </main>
</body>
</html>
        `)
      } else {
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html')
        response.end(html`
<!doctype html>
<html lang=en>
<head>
  <meta charset=UTF-8>
  <title>License Zero | Thank You</title>
  <link rel=stylesheet href=/normalize.css>
  <link rel=stylesheet href=/styles.css>
</head>
<body>
  <header><h1 class=thanks>Thank You</h1></header>
  <main>
    <p>
      Your purchase was successful.
      You will receive receipts and license files by e-mail shortly.
    </p>
  </main>
</body>
</html>
        `)
      }
    })
  })
  request.pipe(parser)
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
  <title>License Zero | Buy Licenses</title>
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
