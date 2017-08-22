var UUIDV4 = require('../data/uuidv4-pattern')
var fs = require('fs')
var licensorPath = require('../paths/licensor')
var parseJSON = require('json-parse-errback')

exports.schema = {
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
}

exports.handler = function (body, service, end, fail) {
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
