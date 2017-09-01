// TODO: POST /pay/{order}
// TODO: POST /pay/{order} error UI

var AJV = require('ajv')
var Busboy = require('busboy')
var TIERS = require('../data/private-license-tiers')
var UUIDV4 = require('../data/uuidv4-pattern')
var applicationFee = require('../stripe/application-fee')
var capitalize = require('./capitalize')
var ed25519 = require('../ed25519')
var escape = require('./escape')
var footer = require('./partials/footer')
var formatPrice = require('./format-price')
var fs = require('fs')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var nav = require('./partials/nav')
var orderPath = require('../paths/order')
var padStart = require('string.prototype.padstart')
var pick = require('../data/pick')
var privateLicense = require('../forms/private-license')
var readJSONFile = require('../data/read-json-file')
var recordAcceptance = require('../data/record-acceptance')
var recordSignature = require('../data/record-signature')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var runWaterfall = require('run-waterfall')
var stringify = require('../stringify')

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
${head('Buy Licenses')}
<body>
  ${nav()}
  ${header()}
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
                <p><code>${escape(product.productID)}</code></p>
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
        <tfoot class=total>
          <tr>
            <td>Total:</td>
            <td class=price>${escape(formatPrice(order.total))}</td>
          </tr>
        </tfoot>
      </table>
    </section>
    <form class=pay method=post action=/pay/${order.orderID}>
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
  </main>
  ${footer()}
</body>
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
    var stripeMetadata = {
      orderID: order.orderID,
      jurisdiction: order.jurisdiction,
      licensee: order.licensee
    }
    var stripeCustomerID
    runSeries([
      // See https://stripe.com/docs/connect/shared-customers.
      function createSharedCustomer (done) {
        service.stripe.api.customers.create({
          metadata: stripeMetadata,
          source: data.token
        }, function (error, customer) {
          if (error) return done(error)
          stripeCustomerID = customer.id
          done()
        })
      },
      runParallel.bind(null,
        [
          recordAcceptance.bind(null, service, {
            licensee: order.licensee,
            jurisdiction: order.jurisdiction,
            email: order.email,
            date: new Date().toISOString()
          })
        ].concat(products.map(function (product) {
          var fee = applicationFee(service, product.price)
          return function (done) {
            runSeries([
              runWaterfall.bind(null, [
                function createSharedCustomerToken (done) {
                  service.stripe.api.tokens.create({
                    customer: stripeCustomerID
                  }, {
                    stripe_account: product.licensor.stripe.id
                  }, done)
                },
                function chargeSharedCustomer (token, done) {
                  service.stripe.api.charges.create({
                    amount: product.price,
                    currency: 'usd',
                    source: token.id,
                    application_fee: fee,
                    statement_descriptor: 'License Zero License',
                    metadata: stripeMetadata
                  }, {
                    stripe_account: product.licensor.stripe.id
                  }, done)
                }
              ]),
              function (done) {
                runWaterfall([
                  function emaiLicense (done) {
                    var parameters = {
                      FORM: 'private license',
                      VERSION: privateLicense.version,
                      date: new Date().toISOString(),
                      tier: order.tier,
                      product: pick(product, [
                        'productID', 'repository', 'description'
                      ]),
                      licensee: {
                        name: order.licensee,
                        jurisdiction: order.jurisdiction
                      },
                      licensor: pick(product.licensor, [
                        'name', 'jurisdiction'
                      ]),
                      price: product.price
                    }
                    var manifest = stringify(parameters)
                    var document = privateLicense(parameters)
                    var license = {
                      productID: product.productID,
                      manifest: manifest,
                      document: document,
                      publicKey: product.licensor.publicKey,
                      signature: ed25519.sign(
                        manifest + '\n\n' + document,
                        product.licensor.privateKey
                      )
                    }
                    service.email({
                      to: data.email,
                      subject: 'License Zero Receipt and License File',
                      text: []
                        .concat([
                          'Thank you for buying a license through ' +
                          'licensezero.com.',
                          'Order ID: ' + order.orderID,
                          'Total: ' + priceColumn(product.price),
                          'Attached is a License Zero license file for:'
                        ])
                        // TODO: Add CLI license import instructions
                        .concat([
                          'Licensee:     ' + order.licensee,
                          'Jurisdiction: ' + order.jurisdiction,
                          'Product:      ' + product.productID,
                          'Description:  ' + product.description,
                          'Repository:   ' + product.repository,
                          'License Tier: ' + capitalize(order.tier)
                        ].join('\n')),
                      license: license
                    }, function (error) {
                      if (error) return done(error)
                      done(null, license)
                    })
                  },
                  function (license, done) {
                    recordSignature(
                      service, license.publicKey, license.signature,
                      function (error) {
                        if (error) return done(error)
                        done(null, license)
                      }
                    )
                  },
                  function emailLicensorStatement (license, done) {
                    service.email({
                      to: product.licensor.email,
                      subject: 'License Zero Statement',
                      text: [
                        [
                          'License Zero sold a license',
                          'on your behalf.'
                        ].join('\n'),
                        [
                          'Order:        ' + order.orderID,
                          'Product:      ' + product.productID,
                          'Description:  ' + product.description,
                          'Repository:   ' + product.repository,
                          'Tier:         ' + capitalize(order.tier)
                        ].join('\n'),
                        [
                          'Price:     ' + priceColumn(product.price),
                          '-----------' + '-'.repeat(10),
                          'Agent Fee: ' + priceColumn(fee),
                          '-----------' + '-'.repeat(10),
                          'Total:     ' + priceColumn(
                            product.total - fee
                          )
                        ].join('\n'),
                        [
                          'The Ed25519 cryptographic signature to the',
                          'license is:'
                        ].join('\n'),
                        [
                          license.signature.slice(0, 32),
                          license.signature.slice(32, 64),
                          license.signature.slice(64, 96),
                          license.signature.slice(96)
                        ].join('\n')
                      ]
                    }, done)
                  }
                ], done)
              }
            ], done)
          }
        }))
      ),
      function (done) {
        runParallel([
          function deleteOrderFile (done) {
            var file = orderPath(service, order.orderID)
            fs.unlink(file, done)
          },
          function deleteCustomer (done) {
            service.stripe.api.customers.del(
              stripeCustomerID, done
            )
          }
        ], done)
      }
    ], function (error) {
      if (error) {
        service.log.error(error)
        response.statusCode = 500
        response.setHeader('Content-Type', 'text/html')
        response.end(html`
<!doctype html>
<html lang=en>
${head('Technical Error')}
<body>
  ${nav()}
  ${header('Technical Error')}
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
  ${footer()}
</body>
</html>
        `)
      } else {
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html')
        response.end(html`
<!doctype html>
<html lang=en>
${head('Thank you')}
<body>
  ${nav()}
  ${header()}
  <main>
    <h1 class=thanks>Thank You</h1>
    <p>
      Your purchase was successful.
      You will receive receipts and license files by e-mail shortly.
    </p>
  </main>
  ${footer()}
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
${head('Invalid or Expired')}
<body>
  ${nav()}
  ${header()}
  <main>
    <h1>Invalid or Expired Purchase</h2>
    <p>
      There is no active purchase at the link you reached.
    </p>
  </main>
</body>
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

function priceColumn (amount) {
  return padStart(formatPrice(amount), 10, ' ')
}
