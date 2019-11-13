var http = require('http-https')
var parseURL = require('url-parse')

var ACCEPTABLE_STATUS = [200, 204, 301]

module.exports = function (body, callback) {
  /* istanbul ignore else */
  if (
    process.env.NODE_ENV === 'test' &&
    body.url.indexOf('http://example.com/') === 0
  ) {
    return callback()
  }
  var url = body.url
  var options = parseURL(url)
  options.method = 'HEAD'
  http.request(options)
    .once('error', function (error) {
      error.userMessage = 'could not HEAD url'
      callback(error)
    })
    .once('response', function (response) {
      var statusCode = response.statusCode
      if (ACCEPTABLE_STATUS.includes(statusCode)) {
        return callback()
      }
      var message = url + ' responded ' + statusCode
      var error = new Error(message)
      error.userMessage = message
      callback(error)
    })
    .end()
}
