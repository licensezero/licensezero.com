var JURISDICTIONS = require('licensezero-jurisdictions')
var email = require('../../email')
var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')
var querystring = require('querystring')
var randomNonce = require('../../data/random-nonce')
var recordAcceptance = require('../../data/record-acceptance')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var stripeNoncePath = require('../../paths/stripe-nonce')

exports.properties = {
  email: require('./common/email'),
  name: {
    description: 'your legal name',
    type: 'string',
    minLength: 4
  },
  jurisdiction: {
    description: 'legal jurisdiction where you reside',
    type: 'string',
    enum: JURISDICTIONS
  },
  terms: require('./common/terms')
}

exports.handler = function (log, body, end, fail) {
  var nonce = randomNonce()
  var file = stripeNoncePath(nonce)
  var timestamp = new Date().toISOString()
  runParallel([
    recordAcceptance.bind(null, {
      email: body.email,
      name: body.name,
      jurisdiction: body.jurisdiction,
      date: new Date().toISOString()
    }),
    runSeries.bind(null, [
      mkdirp.bind(null, path.dirname(file)),
      fs.writeFile.bind(fs, file, JSON.stringify({
        timestamp: timestamp,
        name: body.name,
        email: body.email,
        jurisdiction: body.jurisdiction
      })),
      email.bind(null, log, {
        to: body.email,
        subject: 'Register as a licensezero.com Licensor',
        text: [
          [
            'To register as a licensor through',
            'licensezero.com, follow this link',
            'to connect your Stripe account:'
          ].join('\n'),
          'https://connect.stripe.com/oauth/authorize?' +
          querystring.stringify({
            response_type: 'code',
            client_id: process.env.STRIPE_CLIENT_ID,
            scope: 'read_write',
            state: nonce
          })
        ]
      })
    ])
  ], function (error) {
    /* istanbul ignore if */
    if (error) {
      fail('internal error')
    } else {
      end()
    }
  })
}
