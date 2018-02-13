var AJV = require('ajv')
var argon2 = require('argon2')
var doNotCache = require('do-not-cache')
var lock = require('./lock')
var parseJSON = require('json-parse-errback')
var readLicensor = require('../data/read-licensor')

// TODO: Revisit body size limit for large buys with many UUIDs
var REQUEST_BODY_LIMIT = 500000

var actions = require('./actions')

var ajv = new AJV()
Object.keys(actions).forEach(function (key) {
  var action = actions[key]
  if (action.hasOwnProperty('properties')) {
    var properties = action.properties
    properties.action = {
      type: 'string',
      const: key
    }
    action.schema = {
      type: 'object',
      properties: properties,
      required: Object.keys(properties),
      additionalProperties: false
    }
  } else {
    action.schema = {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          const: key
        }
      },
      required: ['action'],
      additionalProperties: false
    }
  }
  action.validate = ajv.compile(action.schema)
})

module.exports = function api (request, response, service) {
  parseBodyAndRespond()

  function parseBodyAndRespond () {
    var chunks = []
    var bytesReceived = 0
    var destroyed
    request
      .on('data', function (chunk) {
        chunks.push(chunk)
        bytesReceived += chunk.length
        if (bytesReceived > REQUEST_BODY_LIMIT) {
          destroyed = true
          request.destroy()
          end({error: 'request body too large'})
        }
      })
      .once('error', /* istanbul ignore next */ function (error) {
        request.log.error(error)
        end({error: 'error reading request body'})
      })
      .once('end', function () {
        if (destroyed) return
        var buffer = Buffer.concat(chunks)
        parseJSON(buffer, function (error, body) {
          /* istanbul ignore if */
          if (error) {
            fail('invalid JSON')
          } else {
            respond(body)
          }
        })
      })
  }

  function respond (body) {
    if (typeof body !== 'object' || body === null) {
      fail('request not an object')
    } else if (!body.hasOwnProperty('action')) {
      fail('missing action property')
    } else {
      var action = actions[body.action]
      if (!action) {
        fail('invalid action')
      } else {
        if (!action.validate(body)) {
          if (process.env.LOG_API_VALIDATION_ERRORS) {
            console.error(body)
            console.error(action.validate.errors)
          }
          end({
            error: 'invalid body',
            // Avoid sending every valid 3166-2 code across the wire
            // in schemas that require one.
            schema: (function () {
              if (action.schema.properties.jurisdiction) {
                return JSON.parse(
                  JSON.stringify(action.schema, function (name, value) {
                    return name === 'jurisdiction'
                      ? {type: 'string', description: 'ISO 3166-2'}
                      : value
                  })
                )
              } else {
                return action.schema
              }
            })()
          })
        } else {
          if (action.schema.required.includes('token')) {
            checkAuthentication(
              request, body, service, function (error, licensor) {
                /* istanbul ignore if */
                if (error) {
                  fail('internal error')
                } else if (!licensor) {
                  fail('access denied')
                } else {
                  body.licensor = licensor
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
  var licensorID = body.licensorID
  var token = body.token
  readLicensor(service, licensorID, function (error, licensor) {
    if (error) return callback(error)
    argon2.verify(licensor.token, token)
      .then(function (match) {
        callback(null, match ? licensor : false)
      })
  })
}
