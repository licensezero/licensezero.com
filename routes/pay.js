var AJV = require('ajv')
var Busboy = require('busboy')
var UUIDV4 = require('../data/uuidv4-pattern')
var applicationFee = require('../stripe/application-fee')
var ed25519 = require('../util/ed25519')
var email = require('../email')
var escape = require('./escape')
var footer = require('./partials/footer')
var formatPrice = require('../util/format-price')
var fs = require('fs')
var has = require('has')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var last = require('../util/last')
var nav = require('./partials/nav')
var orderPath = require('../paths/order')
var padStart = require('string.prototype.padstart')
var path = require('path')
var pick = require('../data/pick')
var privateLicense = require('../forms/private-license')
var purchasePath = require('../paths/purchase')
var readJSONFile = require('../data/read-json-file')
var recordAcceptance = require('../data/record-acceptance')
var recordSignature = require('../data/record-signature')
var renderJurisdiction = require('./partials/jurisdiction')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var runWaterfall = require('run-waterfall')
var stringify = require('json-stable-stringify')
var stripe = require('../stripe')
var uuid = require('uuid').v4

var ONE_DAY = 24 * 60 * 60 * 1000
var UUID_RE = new RegExp(UUIDV4)

module.exports = function (request, response) {
  var method = request.method
  if (method === 'GET' || method === 'POST') {
    var orderID = request.parameters.order
    if (!UUID_RE.test(orderID)) return purchaseNotFound(response)
    var file = orderPath(orderID)
    return readJSONFile(file, function (error, order) {
      if (error) {
        if (error.code === 'ENOENT') return purchaseNotFound(response)
        return internalError(request, response, error)
      }
      request.log.info(order)
      if (expired(order.date)) {
        request.log.info('expired')
        return purchaseNotFound(response)
      }
      (method === 'GET' ? get : post)(request, response, order)
    })
  }
  response.statusCode = 405
  response.end()
}

function get (request, response, order, postData) {
  response.statusCode = postData ? 400 : 200
  response.setHeader('Content-Type', 'text/html')
  var relicensing = order.type === 'relicense'
  var action = relicensing ? 'Relicense Project' : 'Buy Licenses'
  response.end(html`
<!doctype html>
<html lang=en>
${head(action)}
<body>
  ${nav()}
  ${header()}
  <main role=main>
    ${relicensing ? relicenseUI() : licensesUI()}
    <form class=pay method=post action=/pay/${order.orderID}>
      <section id=payment>
        <h2>Credit Card Payment</h2>
        <div id=card></div>
        <div id=card-errors></div>
        ${errorsFor('token')}
      </section>
      <section id=terms>
        <label>
          <input type=checkbox name=terms value=accepted required>
          Check this box to accept License Zero&rsquo;s
          <a href=/terms/service target=_blank>terms of service</a>.
        </label>
        ${errorsFor('terms')}
      </section>
      <input id=submitButton type=submit value="${escape(action)}">
    </form>
    <script src=https://js.stripe.com/v3/></script>
    <script src=/pay.js></script>
  </main>
  ${footer()}
</body>
</html>
  `)

  function licensesUI () {
    return html`
<section>
  <h2>Licensee</h2>
  <dl>
    <dt>Legal Name</dt><dd>${escape(order.licensee)}</dd>
    <dt>Jurisdiction</dt><dd>${renderJurisdiction(order.jurisdiction)}</dd>
    <dt>E-Mail</dt><dd>${escape(order.email)}</dd>
  </dl>
</section>
<section>
  <table class=invoice>
    <thead>
      <tr>
        <th>License</th>
        <th class=price>Price (USD)</th>
      </tr>
    </thead>
    <tbody>
    ${order.offers.map(function (offer) {
    return html`
        <tr>
          <td>
            <p><code>${escape(offer.offerID)}</code></p>
            <p>${escape(offer.description)}</p>
            <p>
              <a
                href="${escape(offer.homepage)}"
                target=_blank
                >${escape(offer.homepage)}</a>
            </p>
            <p>
              ${escape(last(offer.licensor.name))}
              (${renderJurisdiction(last(offer.licensor.jurisdiction))})
            </p>
            <p>
              Terms:
              <a
                href="/licenses/private"
                target=_blank
              >Private License</a>
            </p>
          </td>
          <td class=price>
            ${escape(formatPrice(offer.price))}
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
    `
  }

  function relicenseUI () {
    var offer = order.offer
    return html`
<section>
  <h2>Sponsor</h2>
  <dl>
    <dt>Legal Name</dt><dd>${escape(order.sponsor)}</dd>
    <dt>Jurisdiction</dt><dd>${renderJurisdiction(order.jurisdiction)}</dd>
    <dt>E-Mail</dt><dd>${escape(order.email)}</dd>
  </dl>
</section>
<section>
  <table class=invoice>
    <thead>
      <tr>
        <th>Relicense</th>
        <th class=price>Price (USD)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <p><code>${escape(offer.offerID)}</code></p>
          <p>${escape(offer.description)}</p>
          <p>
            <a
              href="${escape(offer.homepage)}"
              target=_blank
              >${escape(offer.homepage)}</a>
          </p>
          <p>
            ${escape(last(offer.licensor.name))}
            (${renderJurisdiction(last(offer.licensor.jurisdiction))})
          </p>
          <p>
            Terms: <a
              href=/licenses/relicense
              target=_blank
            >License Zero Relicense Agreement</a>
          </p>
        </td>
        <td class=price>
          ${escape(formatPrice(offer.pricing.relicense))}
        </td>
      </tr>
    </tbody>
    <tfoot class=total>
      <tr>
        <td>Total:</td>
        <td class=price>${escape(formatPrice(offer.pricing.relicense))}</td>
      </tr>
    </tfoot>
  </table>
</section>
    `
  }

  function errorsFor (name) {
    if (!postData) return undefined
    if (!Array.isArray(postData.errors)) return undefined
    var errors = postData.errors.filter(function (error) {
      return error.name === name
    })
    return html`
      ${errors.map(function (error) {
    return html`<p class=error>${escape(error.message)}</p>`
  })}
    `
  }
}

var postSchema = {
  type: 'object',
  properties: {
    terms: {
      const: 'accepted'
    },
    token: {
      type: 'string',
      pattern: '^tok_'
    }
  },
  required: ['terms', 'token'],
  additionalProperties: false
}

var ajv = new AJV({ allErrors: true })
var validatePost = ajv.compile(postSchema)

function post (request, response, order) {
  var data = {}
  request.pipe(
    new Busboy({ headers: request.headers })
      .on('field', function (name, value) {
        if (Object.keys(postSchema.properties).includes(name)) {
          data[name] = value
        }
      })
      .once('finish', function () {
        if (!validatePost(data)) {
          data.errors = validatePost.errors.map(function (error) {
            var dataPath = error.dataPath
            if (dataPath === '.terms') {
              return {
                name: 'terms',
                message: 'You must accept the terms to continue.'
              }
            }
            if (dataPath === '.token') {
              return {
                name: 'token',
                message: 'You must provide payment to continue.'
              }
            }
            request.log.info(error, 'unexpected schema error')
            return null
          })
          return get(request, response, order, data)
        }
        try {
          buyLicenses()
        } catch (error) {
          request.log.error(error, 'ERROR')
          response.end()
        }
      })
  )

  function buyLicenses () {
    var offers = order.offers
    var orderID = order.orderID
    var stripeMetadata = {
      orderID,
      jurisdiction: order.jurisdiction,
      licensee: order.licensee,
      email: order.email
    }
    var stripeCustomerID
    var licenses = []
    var purchaseID = uuid()
    var transactions = batchTransactions(offers)
    runSeries([
      // See https://stripe.com/docs/connect/shared-customers.
      //
      // 1.  Create a Customer object on License Zero's own Stripe
      //     account, using the token from Stripe.js.
      //
      // 2.  Generate a payment token from the Customer for each
      //     Licensor transaction.
      //
      // 3.  Use those tokens to create Charge objects on Licensors'
      //     Connect-ed Stripe accounts.
      //
      // 4.  Capture the charges once the licenses go out by e-mail.
      //
      // 5.  Delete the Customer object, to prevent any further Charges,
      //     Subscriptions, &c.  Stripe will retain records of the
      //     Charges made with generated tokens.
      //
      // Stripe Step 1:
      function createSharedCustomer (done) {
        stripe.customers.create({
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
          recordAcceptance.bind(null, {
            type: 'license',
            licensee: order.licensee,
            jurisdiction: order.jurisdiction,
            email: order.email,
            date: new Date().toISOString()
          })
        ].concat(Object.keys(transactions).map(function (licensorID) {
          var offers = transactions[licensorID]
          var stripeID = offers[0].licensor.stripe.id
          var commission = offers.reduce(function (total, offer) {
            return total + applicationFee(offer)
          }, 0)
          var amount = offers.reduce(function (total, offer) {
            return total + offer.price
          }, 0)
          var chargeID
          return function (done) {
            runSeries([
              runWaterfall.bind(null, [
                // Stripe Step 2:
                function createSharedCustomerToken (done) {
                  stripe.tokens.create({
                    customer: stripeCustomerID
                  }, {
                    stripeAccount: stripeID
                  }, done)
                },
                // Stripe Step 3:
                function chargeSharedCustomer (token, done) {
                  var options = {
                    amount,
                    currency: 'usd',
                    source: token.id,
                    statement_descriptor: 'License Zero License',
                    metadata: stripeMetadata,
                    // Do not capture yet.
                    // Wait until the e-mail goes through.
                    capture: false
                  }
                  if (commission > 0) {
                    options.application_fee = commission
                  }
                  stripe.charges.create(options, {
                    stripeAccount: stripeID
                  }, function (error, charge) {
                    if (error) return done(error)
                    request.log.info(charge, 'charge')
                    chargeID = charge.id
                    done()
                  })
                }
              ]),
              function (done) {
                runParallel(offers.map(function (offer) {
                  return function (done) {
                    runWaterfall([
                      function emaiLicense (done) {
                        var parameters = {
                          FORM: 'private license',
                          VERSION: privateLicense.version,
                          date: new Date().toISOString(),
                          orderID,
                          offer: pick(offer, [
                            'offerID', 'homepage', 'description'
                          ]),
                          licensee: {
                            name: order.licensee,
                            jurisdiction: order.jurisdiction,
                            email: order.email
                          },
                          licensor: pick(offer.licensor, [
                            'name', 'jurisdiction'
                          ]),
                          price: offer.price
                        }
                        var manifest = stringify(parameters)
                        privateLicense(parameters, function (error, document) {
                          if (error) return done(error)
                          var license = {
                            offerID: offer.offerID,
                            metadata: parameters,
                            document,
                            publicKey: process.env.PUBLIC_KEY,
                            signature: ed25519.sign(
                              manifest + '\n\n' + document,
                              Buffer.from(process.env.PUBLIC_KEY, 'hex'),
                              Buffer.from(process.env.PRIVATE_KEY, 'hex')
                            )
                          }
                          licenses.push(license)
                          email(request.log, {
                            to: order.email,
                            bcc: process.env.TRANSACTION_NOTIFICATION_EMAIL,
                            subject: 'License Zero Receipt and License File',
                            text: [
                              'Thank you for buying a license through ' +
                              'licensezero.com.',
                              '',
                              'Order ID: ' + order.orderID,
                              '',
                              'Total: ' + priceColumn(offer.price),
                              '',
                              'Attached is a License Zero license file for:',
                              '',
                              'Licensee:     ' + order.licensee,
                              '',
                              'Jurisdiction: ' + order.jurisdiction,
                              '',
                              'E-Mail:       ' + order.email,
                              '',
                              'Offer:      ' + offer.offerID,
                              '',
                              'Description:  ' + offer.description,
                              '',
                              'Homepage:   ' + offer.homepage
                            ].join('\n'),
                            license
                          }, function (error) {
                            if (error) return done(error)
                            done(null, license)
                          })
                        })
                      },
                      function (license, done) {
                        recordSignature(
                          license.publicKey, license.signature,
                          function (error) {
                            if (error) return done(error)
                            done(null, license)
                          }
                        )
                      },
                      function emailLicensorStatement (license, done) {
                        email(request.log, {
                          to: last(offer.licensor.email),
                          bcc: process.env.TRANSACTION_NOTIFICATION_EMAIL,
                          subject: 'License Zero Statement',
                          text: [
                            'License Zero sold a license',
                            'on your behalf.',
                            '',
                            'Order:        ' + order.orderID,
                            '',
                            'Offer:      ' + offer.offerID,
                            '',
                            'Description:  ' + offer.description,
                            '',
                            'Homepage:   ' + offer.homepage,
                            '',
                            'Licensee:     ' + order.licensee,
                            '',
                            'Jurisdiction: ' + order.jurisdiction,
                            '',
                            'E-Mail:       ' + order.email,
                            '',
                            'Price:      ' + priceColumn(offer.price),
                            '',
                            'Commission: ' + priceColumn(commission),
                            '',
                            'Total:      ' + priceColumn(offer.price - commission),
                            '',
                            'The Ed25519 cryptographic signature to the ',
                            'license is:',
                            '',
                            license.signature.slice(0, 32),
                            license.signature.slice(32, 64),
                            license.signature.slice(64, 96),
                            license.signature.slice(96)
                          ].join('\n')
                        }, done)
                      }
                    ], done)
                  }
                }), function (error) {
                  if (error) return done(error)
                  // Stripe Step 4:
                  stripe.charges.capture(
                    chargeID,
                    {},
                    { stripeAccount: stripeID },
                    done
                  )
                })
              }
            ], done)
          }
        }))
      ),
      function (done) {
        runParallel([
          function deleteOrderFile (done) {
            var file = orderPath(order.orderID)
            fs.unlink(file, done)
          },
          // Stripe Step 5:
          function deleteCustomer (done) {
            stripe.customers.del(
              stripeCustomerID, done
            )
          },
          // Write a JSON file containing all license data,
          // from all transactions, to a capability URL
          // generated for the purchase. The licensee can
          // use this URL to load all the new licenses into
          // CLI at once, without pulling them out of
          // e-mail.
          function writePurchase (done) {
            var file = purchasePath(purchaseID)
            runSeries([
              fs.mkdir.bind(fs, path.dirname(file), { recursive: true }),
              fs.writeFile.bind(null, file, JSON.stringify({
                date: new Date().toISOString(),
                licenses
              }))
            ], done)
          }
        ], done)
      }
    ], function (error) {
      if (error) {
        technicalError(request, response, error, [
          'One or more of your license purchases ' +
          'failed to go through, due to a technical error.',
          'Please check your e-mail for any purchases ' +
          'that may have completed successfully.'
        ])
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
  <main role=main>
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
  }
}

function expired (created) {
  return (new Date() - new Date(created)) > ONE_DAY
}

function batchTransactions (offers) {
  var returned = {}
  offers.forEach(function (offer) {
    var licensorID = offer.licensor.licensorID
    if (has(returned, licensorID)) {
      returned[licensorID].push(offer)
    } else {
      returned[licensorID] = [offer]
    }
  })
  return returned
}

function purchaseNotFound (response) {
  response.statusCode = 404
  response.setHeader('Content-Type', 'text/html')
  response.end(html`
<!doctype html>
<html lang=en>
${head('Invalid or Expired')}
<body>
  ${nav()}
  ${header()}
  <main role=main>
    <h1>Invalid or Expired Purchase</h2>
    <p>
      There is no active purchase at the link you reached.
    </p>
  </main>
</body>
</html>
  `)
}

function priceColumn (amount) {
  return padStart(formatPrice(amount), 10, ' ')
}

function technicalError (request, response, error, paragraphs) {
  request.log.error(error)
  response.statusCode = 500
  response.setHeader('Content-Type', 'text/html')
  var message = paragraphs
    .map(function (string) {
      return `<p>${escape(string)}</p>`
    })
    .join('')
  response.end(html`
<!doctype html>
<html lang=en>
${head('Technical Error')}
<body>
  ${nav()}
  ${header('Technical Error')}
  <main role=main>${message}</main>
  ${footer()}
</body>
</html>
  `)
}
