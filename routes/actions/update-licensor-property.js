var UUIDV4 = require('../../data/uuidv4-pattern')
var fs = require('fs')
var licensorPath = require('../../paths/licensor')
var parseJSON = require('json-parse-errback')
var runWaterfall = require('run-waterfall')

module.exports = function (key) {
  var properties = {
    licensor: {
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
    schema: {properties: properties},
    handler: function (body, service, end, fail, lock) {
      var licensorID = body.licensor.licensorID
      var file = licensorPath(service, licensorID)
      lock(licensorID, function (release) {
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
