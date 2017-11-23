var AJV = require('ajv')
var Busboy = require('busboy')
var TIERS = require('../data/private-license-tiers')
var UUIDV4 = require('../data/uuidv4-pattern')
var annotateENOENT = require('../data/annotate-enoent')
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
var lock = require('./lock')
var mkdirp = require('mkdirp')
var mutateJSONFile = require('../data/mutate-json-file')
var mutateTextFile = require('../data/mutate-text-file')
var nav = require('./partials/nav')
var orderPath = require('../paths/order')
var outline = require('outline-numbering')
var padStart = require('string.prototype.padstart')
var parseProjects = require('../data/parse-projects')
var path = require('path')
var pick = require('../data/pick')
var privateLicense = require('../forms/private-license')
var projectPath = require('../paths/project')
var projectsListPath = require('../paths/projects-list')
var purchasePath = require('../paths/purchase')
var readJSONFile = require('../data/read-json-file')
var recordAcceptance = require('../data/record-acceptance')
var recordSignature = require('../data/record-signature')
var relicenseAgreement = require('../forms/relicense-agreement')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var runWaterfall = require('run-waterfall')
var signatureLines = require('../data/signature-lines')
var stringify = require('../stringify')
var stringifyProjects = require('../data/stringify-projects')
var stripANSI = require('strip-ansi')
var toANSI = require('commonform-terminal')
var uuid = require('uuid/v4')

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

function get (request, response, service, order, postData) {
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
  <main>
    ${relicensing ? relicenseUI() : licensesUI()}
    <form class=pay method=post action=/pay/${order.orderID}>
      <section id=payment>
        <h2>Credit Card Payment</h2>
        <div id=card></div>
        <div id=card-errors></div>
        ${errorsFor('token')}
      </section>
      <section id=email>
        <label>
          Your E-Mail Address:
          <input name=email type=email value="${postValue('name')}">
        </label>
        ${errorsFor('email')}
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
    <dt>Jurisdiction</dt><dd>[${escape(order.jurisdiction)}]</dd>
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
    ${order.projects.map(function (project) {
      return html`
        <tr>
          <td>
            <p><code>${escape(project.projectID)}</code></p>
            <p>${escape(project.description)}</p>
            <p>
              <a
                href="${escape(project.repository)}"
                target=_blank
                >${escape(project.repository)}</a>
            </p>
            <p>
              ${escape(project.licensor.name)}
              [${escape(project.licensor.jurisdiction)}]
            </p>
            <p>
              Terms:
              <a
                href="/licenses/private#${order.tier}"
                target=_blank
              >${escape(capitalize(order.tier))} License</a>
              (${
                order.tier === 'solo'
                  ? 'one user'
                  : TIERS[order.tier] + ' users'
              })
            </p>
          </td>
          <td class=price>
            ${escape(formatPrice(project.price))}
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
    var project = order.project
    return html`
<section>
  <h2>Sponsor</h2>
  <dl>
    <dt>Legal Name</dt><dd>${escape(order.sponsor)}</dd>
    <dt>Jurisdiction</dt><dd>[${escape(order.jurisdiction)}]</dd>
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
          <p><code>${escape(project.projectID)}</code></p>
          <p>${escape(project.description)}</p>
          <p>
            <a
              href="${escape(project.repository)}"
              target=_blank
              >${escape(project.repository)}</a>
          </p>
          <p>
            ${escape(project.licensor.name)}
            [${escape(project.licensor.jurisdiction)}]
          </p>
          <p>
            Terms: <a
              href=/licenses/relicense
              target=_blank
            >License Zero Relicense Agreement</a>
          </p>
        </td>
        <td class=price>
          ${escape(formatPrice(project.pricing.relicense))}
        </td>
      </tr>
    </tbody>
    <tfoot class=total>
      <tr>
        <td>Total:</td>
        <td class=price>${escape(formatPrice(project.pricing.relicense))}</td>
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

  function postValue (name) {
    if (!postData) return undefined
    if (!postData[name]) return undefined
    return escape(postData[name])
  }
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

var ajv = new AJV({allErrors: true})
var validatePost = ajv.compile(postSchema)

function post (request, response, service, order) {
  var data = {}
  request.pipe(
    new Busboy({headers: request.headers})
      .on('field', function (name, value) {
        if (Object.keys(postSchema.properties).includes(name)) {
          data[name] = value
        }
      })
      .once('finish', function () {
        if (!validatePost(data)) {
          data.errors = validatePost.errors.map(function (error) {
            var dataPath = error.dataPath
            if (dataPath === '.email') {
              return {
                name: 'email',
                message: 'You must provide a valid e-mail address.'
              }
            } else if (dataPath === '.terms') {
              return {
                name: 'terms',
                message: 'You must accept the terms to continue.'
              }
            } else if (dataPath === '.token') {
              return {
                name: 'token',
                message: 'You must provide payment to continue.'
              }
            } else {
              service.log.info(error, 'unexpected schema error')
              return null
            }
          })
          return get(request, response, service, order, data)
        }
        (order.type === 'relicense' ? buyRelicense : buyLicenses)()
      })
  )

  function buyLicenses () {
    var projects = order.projects
    var orderID = order.orderID
    var stripeMetadata = {
      orderID: orderID,
      jurisdiction: order.jurisdiction,
      licensee: order.licensee
    }
    var stripeCustomerID
    var licenses = []
    var purchaseID = uuid()
    var transactions = batchTransactions(projects)
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
            type: 'license',
            licensee: order.licensee,
            jurisdiction: order.jurisdiction,
            email: order.email,
            date: new Date().toISOString()
          })
        ].concat(Object.keys(transactions).map(function (licensorID) {
          var projects = transactions[licensorID]
          var stripeID = projects[0].licensor.stripe.id
          var commission = projects.reduce(function (total, project) {
            return total + applicationFee(project)
          }, 0)
          var amount = projects.reduce(function (total, project) {
            return total + project.price
          }, 0)
          var chargeID
          return function (done) {
            runSeries([
              runWaterfall.bind(null, [
                // Stripe Step 2:
                function createSharedCustomerToken (done) {
                  service.stripe.api.tokens.create({
                    customer: stripeCustomerID
                  }, {
                    stripe_account: stripeID
                  }, done)
                },
                // Stripe Step 3:
                function chargeSharedCustomer (token, done) {
                  var options = {
                    amount: amount,
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
                  service.stripe.api.charges.create(options, {
                    stripe_account: stripeID
                  }, function (error, charge) {
                    if (error) return done(error)
                    service.log.info(charge, 'charge')
                    chargeID = charge.id
                    done()
                  })
                }
              ]),
              function (done) {
                runParallel(projects.map(function (project) {
                  return function (done) {
                    runWaterfall([
                      function emaiLicense (done) {
                        var parameters = {
                          FORM: 'private license',
                          VERSION: privateLicense.version,
                          date: new Date().toISOString(),
                          orderID: orderID,
                          tier: order.tier,
                          project: pick(project, [
                            'projectID', 'repository', 'description'
                          ]),
                          licensee: {
                            name: order.licensee,
                            jurisdiction: order.jurisdiction
                          },
                          licensor: pick(project.licensor, [
                            'name', 'jurisdiction'
                          ]),
                          price: project.price
                        }
                        var manifest = stringify(parameters)
                        privateLicense(parameters, function (error, document) {
                          if (error) return done(error)
                          var license = {
                            projectID: project.projectID,
                            manifest: manifest,
                            document: document,
                            publicKey: project.licensor.publicKey,
                            signature: ed25519.sign(
                              manifest + '\n\n' + document,
                              project.licensor.publicKey,
                              project.licensor.privateKey
                            )
                          }
                          licenses.push(license)
                          service.email({
                            to: data.email,
                            subject: 'License Zero Receipt and License File',
                            text: []
                              .concat([
                                'Thank you for buying a license through ' +
                                'licensezero.com.',
                                'Order ID: ' + order.orderID,
                                'Total: ' + priceColumn(project.price),
                                'Attached is a License Zero license file for:'
                              ])
                              .concat([
                                'Licensee:     ' + order.licensee,
                                'Jurisdiction: ' + order.jurisdiction,
                                'Project:      ' + project.projectID,
                                'Description:  ' + project.description,
                                'Repository:   ' + project.repository,
                                'License Tier: ' + capitalize(order.tier)
                              ].join('\n')),
                            license: license
                          }, function (error) {
                            if (error) return done(error)
                            done(null, license)
                          })
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
                          to: project.licensor.email,
                          subject: 'License Zero Statement',
                          text: [
                            [
                              'License Zero sold a license',
                              'on your behalf.'
                            ].join('\n'),
                            [
                              'Order:        ' + order.orderID,
                              'Project:      ' + project.projectID,
                              'Description:  ' + project.description,
                              'Repository:   ' + project.repository,
                              'Tier:         ' + capitalize(order.tier)
                            ].join('\n'),
                            [
                              'Price:      ' + priceColumn(project.price),
                              'Commission: ' + priceColumn(commission),
                              'Total:      ' + priceColumn(project.price - commission)
                            ].join('\n'),
                            [
                              'The Ed25519 cryptographic signature to the ',
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
                }), function (error) {
                  if (error) return done(error)
                  // Stripe Step 4:
                  service.stripe.api.charges.capture(
                    chargeID,
                    {},
                    {stripe_account: stripeID},
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
            var file = orderPath(service, order.orderID)
            fs.unlink(file, done)
          },
          // Stripe Step 5:
          function deleteCustomer (done) {
            service.stripe.api.customers.del(
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
            var file = purchasePath(service, purchaseID)
            runSeries([
              mkdirp.bind(null, path.dirname(file)),
              fs.writeFile.bind(null, file, JSON.stringify({
                date: new Date().toISOString(),
                licenses: licenses
              }))
            ], done)
          }
        ], done)
      }
    ], function (error) {
      if (error) {
        technicalError(service, response, error, [
          'One or more of your license purchases ' +
          'failed to go through, due to a technical error.',
          'Please check your e-mail for any purchases ' +
          'that may have completed successfully.'
        ])
      } else {
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html')
        var purchaseURL = (
          'https://licensezero.com/purchases/' + purchaseID
        )
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
    <p>
      To load all of your new licenses into the License
      Zero command line interface, run the following
      command anytime in the next twenty four hours:
    </p>
    <pre><code class=install>l0-purchased ${purchaseURL}</code></pre>
  </main>
  ${footer()}
</body>
</html>
        `)
      }
    })
  }

  function buyRelicense () {
    var project = order.project
    var projectID = project.projectID
    var price = project.pricing.relicense
    var commission = Math.floor(Math.min(60000, (price * 0.06)))
    var licensor = order.project.licensor
    var licensorID = licensor.licensorID
    var stripeID = licensor.stripe.id
    var stripeMetadata = {
      type: 'relicense',
      orderID: order.orderID,
      jurisdiction: order.jurisdiction,
      sponsor: order.sponsor
    }
    var date = new Date().toISOString()
    var chargeID
    var licensorSignature
    var agentSignature
    var agreement

    lock([licensorID, projectID], function (release) {
      runSeries([
        task('generated agreement', generateSignedAgreement),
        task('charged customer', chargeCustomer),
        runParallel.bind(null, [
          task('recorded acceptance', recordSponsorTermsAcceptance),
          task('captured charge', captureCharge),
          task('emailed agreement', emailAgreement),
          task('notified licensor', emailLicensor),
          task('recorded agent signature', recordAgentSignature),
          task('recordded licensor signature', recordLicensorSignature)
        ]),
        task('deleted order file', deleteOrderFile),
        task('updated project', updateProject)
      ], release(function (error) {
        if (error) {
          technicalError(service, response, error, [
            'Part of the relicense process failed to go through, ' +
            'due to a technical error.',
            'Please check your e-mail.'
          ])
        } else {
          thanks(response, [
            'Your relicense transaction processed successfully. ' +
            'You will receive a receipt and a signed agreement ' +
            'by e-mail shortly.',
            'The project licensor will receive an e-mail notification.'
          ])
        }
      }))
    })

    function task (message, task) {
      return function (done) {
        task(function (error) {
          if (error) return done(error)
          service.log.info(message)
          done()
        })
      }
    }

    function generateSignedAgreement (done) {
      relicenseAgreement({
        'Date': date,
        'Developer Name': licensor.name,
        'Developer Jurisdiction': licensor.jurisdiction,
        'Sponsor Name': order.sponsor,
        'Sponsor Jurisdiction': order.jurisdiction,
        'Project ID': project.projectID,
        'Repository': project.repository,
        'License Identifier': 'BSD-2-Clause',
        'Payment': formatPrice(price)
      }, function (error, form) {
        if (error) return done(error)
        agreement = (
          'License Zero Relicense Agreement\n\n' +
          stripANSI(
            toANSI(
              form.commonform,
              form.directions,
              {numbering: outline}
            )
          )
            .replace(/^ {4}/, '')
            .replace(/ +$/, '')
        )
        licensorSignature = ed25519.sign(
          agreement,
          licensor.publicKey,
          licensor.privateKey
        )
        agreement += '\n\nLicensor Ed25519 Signature:\n\n'
        agreement += signatureLines(licensorSignature)
        agentSignature = ed25519.sign(
          agreement,
          service.publicKey,
          service.privateKey
        )
        agreement += '\n\nAgent Ed25519 Signature:\n\n'
        agreement += signatureLines(agentSignature)
        done()
      })
    }

    function chargeCustomer (done) {
      var options = {
        amount: price,
        currency: 'usd',
        // Important: Authorize, but don't capture/charge yet.
        capture: false,
        source: data.token,
        statement_descriptor: 'License Zero Relicense',
        metadata: stripeMetadata
      }
      if (commission > 0) {
        options.application_fee = commission
      }
      service.stripe.api.charges.create(options, {
        stripe_account: stripeID
      }, function (error, charge) {
        if (error) return done(error)
        chargeID = charge.id
        service.log.info(charge, 'charge')
        done()
      })
    }

    function recordSponsorTermsAcceptance (done) {
      recordAcceptance(service, {
        type: 'relicense',
        sponsor: order.sponsor,
        jurisdiction: order.jurisdiction,
        email: order.email,
        date: date
      }, done)
    }

    function captureCharge (done) {
      service.stripe.api.charges.capture(
        chargeID,
        {},
        {stripe_account: stripeID},
        function (error) {
          if (error) return done(error)
          service.log.info({chargeID: chargeID}, 'captured')
          done()
        }
      )
    }

    function emailAgreement (done) {
      service.email({
        to: data.email,
        cc: licensor.email,
        subject: 'License Zero Relicense Agreement',
        text: []
          .concat([
            'Thank you for sponsoring a relicense through ' +
            'licensezero.com.',
            'Order ID: ' + order.orderID,
            'Total: ' + priceColumn(price),
            'Attached is a signed relicense agreement for:'
          ])
          .concat([
            'Project:      ' + project.projectID,
            'Description:  ' + project.description,
            'Repository:   ' + project.repository
          ].join('\n')),
        agreement: agreement
      }, done)
    }

    function emailLicensor (done) {
      service.email({
        to: licensor.email,
        subject: 'License Zero Relicense',
        text: [
          [
            'License Zero sold a relicense agreement',
            'on your behalf:'
          ].join('\n'),
          [
            'Order:        ' + order.orderID,
            'Project:      ' + project.projectID,
            'Description:  ' + project.description,
            'Repository:   ' + project.repository
          ].join('\n'),
          [
            'Price:      ' + priceColumn(price),
            'Commission: ' + priceColumn(commission),
            'Total:      ' + priceColumn(price - commission)
          ].join('\n'),
          [
            'You will be copied on a message attaching',
            'the signed relicense agreement shortly.',
            'Your next steps are set out in the',
            '"Relicensing" section of the agreement.'
          ].join('\n')
        ]
      }, done)
    }

    function recordAgentSignature (done) {
      recordSignature(
        service,
        service.publicKey, agentSignature,
        done
      )
    }

    function recordLicensorSignature (done) {
      recordSignature(
        service,
        project.licensor.publicKey, licensorSignature,
        done
      )
    }

    function deleteOrderFile (done) {
      var file = orderPath(service, order.orderID)
      fs.unlink(file, done)
    }

    function updateProject (done) {
      runSeries([
        markRelicensed,
        removeFromProjectsList
      ], done)
    }

    function markRelicensed (done) {
      var file = projectPath(service, projectID)
      mutateJSONFile(file, function (data) {
        data.relicensed = true
      }, annotateENOENT('no such project', done))
    }

    function removeFromProjectsList (done) {
      var file = projectsListPath(service, licensorID)
      mutateTextFile(file, function (text) {
        return stringifyProjects(
          parseProjects(text).map(function (element) {
            if (
              element.projectID === projectID &&
              element.relicensed === null
            ) {
              element.relicensed = date
            }
            return element
          })
        )
      }, done)
    }
  }
}

function expired (created) {
  return (new Date() - new Date(created)) > ONE_DAY
}

function batchTransactions (projects) {
  var returned = {}
  projects.forEach(function (project) {
    var licensorID = project.licensor.licensorID
    if (returned.hasOwnProperty(licensorID)) {
      returned[licensorID].push(project)
    } else {
      returned[licensorID] = [project]
    }
  })
  return returned
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

function priceColumn (amount) {
  return padStart(formatPrice(amount), 10, ' ')
}

function thanks (response, paragraphs) {
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
    ${paragraphs.map(function (paragraph) {
      return html`<p>${escape(paragraph)}</p>`
    })}
  </main>
  ${footer()}
</body>
</html>
  `)
}

function technicalError (service, response, error, paragraphs) {
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
    </p>
  </main>
  ${footer()}
</body>
</html>
  `)
}
