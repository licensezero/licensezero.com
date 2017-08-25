var AJV = require('ajv')
var Lock = require('lock')
var argon2 = require('argon2')
var doNotCache = require('do-not-cache')
var fs = require('fs')
var licensorPath = require('../paths/licensor')
var parseJSON = require('json-parse-errback')
var runWaterfall = require('run-waterfall')

// TODO: Revisit body size limit for large buys with many UUIDs
var REQUEST_BODY_LIMIT = 1024

var actions = require('./actions')

var ajv = new AJV()
Object.keys(actions).forEach(function (key) {
  var action = actions[key]
  if (action.hasOwnProperty('schema')) {
    var schema = action.schema
    schema.type = 'object'
    if (!schema.required) {
      schema.required = Object.keys(schema.properties).concat('action')
    } else if (!schema.required.includes('action')) {
      schema.required.push('action')
    }
    if (!schema.properties.hasOwnProperty('action')) {
      schema.properties.action = {
        type: 'string',
        const: key
      }
    }
    schema.additionalProperties = false
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

var lock = new Lock()

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
          end({
            error: 'invalid body',
            schema: action.schema
          })
        } else {
          if (action.schema.required.includes('password')) {
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
  var password = body.password
  runWaterfall([
    fs.readFile.bind(fs, licensorPath(service, licensorID)),
    parseJSON,
    function (licensor, done) {
      argon2.verify(licensor.password, password)
        .then(function (match) {
          callback(null, match ? licensor : false)
        })
    }
  ], callback)
}
