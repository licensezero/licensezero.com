var fs = require('fs')
var licensorPath = require('../../paths/licensor')
var parseJSON = require('json-parse-errback')
var runWaterfall = require('run-waterfall')

module.exports = function (key) {
  var properties = {
    licensorID: require('./common/licensor-id'),
    token: { type: 'string' }
  }
  properties[key] = require('./register').properties[key]
  return {
    properties,
    handler: function (log, body, end, fail, lock) {
      var licensorID = body.licensorID
      var file = licensorPath(licensorID)
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
          if (error) return fail('internal error')
          end()
        }))
      })
    }
  }
}
