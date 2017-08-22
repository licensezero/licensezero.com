var http = require('http')
var parseJSON = require('json-parse-errback')
var simpleConcat = require('simple-concat')

module.exports = function (port, body, callback) {
  http.request({method: 'POST', port: port, path: '/api/v0'})
    .once('error', callback)
    .once('response', function (response) {
      simpleConcat(response, function (error, buffer) {
        if (error) {
          callback(error)
        } else {
          parseJSON(buffer, callback)
        }
      })
    })
    .end(JSON.stringify(body))
}
