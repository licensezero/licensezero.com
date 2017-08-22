var AJV = require('ajv')
var Lock = require('lock')
var US_3166_2 = require('../data/us-3166-2')
var UUIDV4 = require('../data/uuidv4-pattern')
var argon2 = require('argon2')
var doNotCache = require('do-not-cache')
var fs = require('fs')
var licensorPath = require('../paths/licensor')
var mkdirp = require('mkdirp')
var parseJSON = require('json-parse-errback')
var path = require('path')
var querystring = require('querystring')
var randomNonce = require('../data/random-nonce')
var runSeries = require('run-series')
var runWaterfall = require('run-waterfall')
var stripeNoncePath = require('../paths/stripe-nonce')

var REQUEST_BODY_LIMIT = 1024
var JURISDICTIONS = US_3166_2.map(function (state) {
  return 'US-' + state
})

var actions = {
  register: {
    schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          const: 'register'
        },
        email: {
          description: 'your e-mail address',
          type: 'string',
          format: 'email'
        },
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
        terms: {
          type: 'string',
          const: 'I agree to the terms of service.'
        }
      },
      required: ['action', 'email', 'name', 'jurisdiction', 'terms'],
      additionalProperties: false
    },

    handler: function (body, service, end, fail) {
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
        service.email.bind(null, {
          to: body.email,
          subject: 'Register as a licensezero.com Licensor',
          text: [
            'To register as a licensor through',
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
          fail('internal error')
        } else {
          end()
        }
      })
    }
  },

  describe: {
    schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          const: 'describe'
        },
        id: {
          description: 'licensor id',
          type: 'string',
          pattern: UUIDV4
        }
      },
      required: ['action', 'id'],
      additionalProperties: false
    },

    handler: function (body, service, end, fail) {
      var id = body.id
      var file = licensorPath(service, id)
      fs.readFile(file, function (error, buffer) {
        if (error) {
          if (error.code === 'ENOENT') {
            fail('no such licensor')
          } else {
            fail('internal error')
          }
        } else {
          parseJSON(buffer, function (error, licensor) {
            if (error) {
              fail('internal error')
            } else {
              end({
                name: licensor.name,
                jurisdiction: licensor.name,
                publicKey: licensor.publicKey
              })
            }
          })
        }
      })
    }
  },

  jurisdiction: {
    schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          const: 'jurisdiction'
        },
        id: {
          description: 'licensor id',
          type: 'string',
          pattern: UUIDV4
        },
        password: {
          description: 'licensor password',
          type: 'string'
        },
        jurisdiction: {
          description: 'new jurisdiction',
          type: 'string',
          enum: JURISDICTIONS
        }
      },
      required: ['action', 'id', 'password', 'jurisdiction'],
      additionalProperties: false
    },

    handler: function (body, service, end, fail, lock) {
      var id = body.id
      var file = licensorPath(service, id)
      lock(file, function (release) {
        runWaterfall([
          fs.readFile.bind(fs, file),
          parseJSON,
          function (licensor, done) {
            licensor.jurisdiction = body.jurisdiction
            fs.writeFile(file, JSON.stringify(licensor), done)
          }
        ], release(function (error) {
          if (error) {
            fail('internal error')
          } else {
            end()
          }
        }))
      })
    }
  }
}

var ajv = new AJV()
Object.keys(actions).forEach(function (key) {
  if (actions[key].hasOwnProperty('schema')) {
    var action = actions[key]
    action.validate = ajv.compile(action.schema)
  }
})

var lock = new Lock()

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
            fail('invalid JSON')
          } else {
            respond(body)
          }
        })
      })
  }

  function respond (body) {
    if (typeof body !== 'object') {
      fail('request not an object')
    } else if (!body.hasOwnProperty('action')) {
      fail('missing action property')
    } else {
      var action = actions[body.action]
      if (!action) {
        fail('invalid action')
      } else {
        if (!action.validate(body)) {
          end({
            error: 'invalid body',
            schema: action.schema
          })
        } else {
          if (action.schema.required.includes('password')) {
            checkAuthentication(
              request, body, service, function (error, valid) {
                if (error) {
                  fail('internal error')
                } else if (!valid) {
                  fail('access denied')
                } else {
                  route()
                }
              }
            )
          } else {
            route()
          }
        }
      }
    }

    function route () {
      action.handler(body, service, end, fail, lock)
    }
  }

  function fail (string) {
    end({error: string})
  }

  function end (object) {
    object = object || {}
    if (!object.hasOwnProperty('error')) {
      object.error = false
    }
    doNotCache(response)
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify(object))
  }
}

function checkAuthentication (request, body, service, callback) {
  var id = body.id
  var password = body.password
  runWaterfall([
    fs.readFile.bind(fs, licensorPath(service, id)),
    parseJSON,
    function (parsed, done) {
      argon2.verify(parsed.password, password)
        .then(function (match) {
          callback(null, match)
        })
    }
  ], callback)
}
