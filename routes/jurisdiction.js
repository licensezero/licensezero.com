var JURISDICTIONS = require('../data/jurisdictions')
var UUIDV4 = require('../data/uuidv4-pattern')
var fs = require('fs')
var licensorPath = require('../paths/licensor')
var parseJSON = require('json-parse-errback')
var runWaterfall = require('run-waterfall')

exports.schema = {
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
}

exports.handler = function (body, service, end, fail, lock) {
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
