var AJV = require('ajv')
var Lock = require('lock')
var argon2 = require('argon2')
var doNotCache = require('do-not-cache')
var fs = require('fs')
var licensorPath = require('../paths/licensor')
var parseJSON = require('json-parse-errback')
var runWaterfall = require('run-waterfall')

var REQUEST_BODY_LIMIT = 1024

var actions = {
  register: require('./register'),
  describe: require('./describe'),
  jurisdiction: require('./jurisdiction'),
  offer: require('./offer')
}

var ajv = new AJV()
Object.keys(actions).forEach(function (key) {
  if (actions[key].hasOwnProperty('schema')) {
    var action = actions[key]
    var schema = action.schema
    if (!schema.required) {
      schema.required = ['action']
    } else if (schema.required.includes('aciton')) {
      schema.required.push('action')
    }
    if (!schema.properties.hasOwnProperty('action')) {
      schema.properties.action = {
        type: 'string',
        const: key
      }
    }
    action.validate = ajv.compile(schema)
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
          callback(null, match ? parsed : false)
        })
    }
  ], callback)
}
