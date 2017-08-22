var AJV = require('ajv')
var US_3166_2 = require('../data/us-3166-2')
var crypto = require('crypto')
var doNotCache = require('do-not-cache')
var email = require('../email')
var fs = require('fs')
var mkdirp = require('mkdirp')
var parseJSON = require('json-parse-errback')
var path = require('path')
var querystring = require('querystring')
var randomNonce = require('../data/random-nonce')
var runSeries = require('run-series')
var stripeNoncePath = require('../paths/stripe-nonce')

var REQUEST_BODY_LIMIT = 1024

var actions = {
  register: {
    schema: {
      type: 'object',
      properties: {
        email: {
          description: 'your e-mail address',
          type: 'string',
          pattern: 'email'
        },
        name: {
          description: 'your legal name'
          type: 'string',
          minLength: 4
        },
        jurisdiction: {
          description: 'legal jurisdiction where you reside',
          type: 'string',
          enum: US_3166_2.map(function (state) {
            return 'US-' + state
          })
        }
      },
      required: ['email', 'jurisdiction'],
      additionalProperties: false
    },

    handler: function (body, service, end, error) {
      var nonce = randomNonce()
      var file = stripeNoncePath(service, nonce)
      var timestamp = new Date().toISOString()
      runSeries([
        mkdirp.bind(null, path.dirname(file)),
        fs.writeFile.bind(fs, file, JSON.stringify({
          timestamp: timestamp,
          name: body.name,
          email: body.email,
          jurisdiction: body.jurisdiction
        })),
        email.bind(null, {
          to: body.email,
          subject: 'Register as a licensezero.com Licensor',
          text: [
            'To register as a Licensor through',
            'licensezero.com, follow this link',
            'to connect your Stripe account:',
            '',
            'https://connect.stripe.com/oauth/authorize?' +
            querystring.stringify({
              response_type: 'code',
              client_id: service.STRIPE_ID,
              scope: 'read_write',
              state: nonce
            })
          ]
        })
      ], function (error) {
        if (error) {
          error('internal error')
        }
      })
    }
  }
}

var ajv = new AJV()
Object.keys(actions).forEach(function (action) {
  if (action.hasOwnProperty('schema')) {
    action.validate = ajv.compile(action.schema)
  }
})

module.exports = function api (request, response, service) {
  parseBodyAndRespond()

  function parseBodyAndRespond () {
    var chunks = []
    var bytesReceived = 0
    request
      .on('data', function (chunk) {
        chunks.push(chunk)
        bytesReceived += chunk.length
        if (bytesReceived > REQUEST_BODY_LIMIT) {
          request.destroy()
          end({error: 'request body too large'})
        }
      })
      .once('error', function (error) {
        request.log.error(error)
        end({error: 'error reading request body'})
      })
      .once('end', function () {
        var buffer = Buffer.concat(chunks)
        parseJSON(buffer, function (error, body) {
          if (error) {
            error('invalid JSON')
          } else {
            respond(body)
          }
        })
      })
  }

  function respond (body) {
    if (typeof body !== 'object') {
      error('request not an object')
    } else if (!body.hasOwnProperty('action')) {
      error('missing action property')
    } else {
      var action = handlers[body.action]
      if (!action) {
        error('invalid action')
      } else {
        if (action.validate && !action.validate(body)) {
          return end({
            error: 'invalid body',
            schema: action.schema
          })
        }
        handler(body, service, end, error)
      }
    }
  }

  function error (message) {
    end({error: message})
  }

  function end (object) {
    if (!object.hasOwnProperty('error')) {
      object.error = false
    }
    doNotCache(response)
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify(object))
  }
}
