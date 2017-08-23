var UUIDV4 = require('../../data/uuidv4-pattern')
var fs = require('fs')
var licensorPath = require('../../paths/licensor')
var parseJSON = require('json-parse-errback')
var runWaterfall = require('run-waterfall')

module.exports = function (key) {
  var properties = {
    id: {
      description: 'licensor id',
      type: 'string',
      pattern: UUIDV4
    },
    password: {
      description: 'licensor password',
      type: 'string'
    }
  }
  properties[key] = require('./register').schema.properties[key]
  return {
    schema: {
      type: 'object',
      properties: properties,
      required: Object.keys(properties),
      additionalProperties: false
    },
    handler: function (body, service, end, fail, lock) {
      var id = body.id
      var file = licensorPath(service, id)
      lock(id, function (release) {
        runWaterfall([
          fs.readFile.bind(fs, file),
          parseJSON,
          function (data, done) {
            data[key] = body[key]
            fs.writeFile(file, JSON.stringify(data), done)
          }
        ], release(function (error) {
          /* istanbul ignore if */
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
