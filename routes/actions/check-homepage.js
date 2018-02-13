var http = require('http-https')
var url = require('url')

var TESTING = process.env.NODE_ENV === 'test'

var ACCEPTABLE_STATUS = [200, 204, 301]

module.exports = function (body, callback) {
  /* istanbul ignore else */
  if (
    TESTING &&
    body.homepage.indexOf('http://example.com/') === 0
  ) {
    return callback()
  } else {
    var homepage = body.homepage
    var options = url.parse(homepage)
    options.method = 'HEAD'
    http.request(options)
      .once('error', function (error) {
        error.userMessage = 'could not HEAD homepage'
        callback(error)
      })
      .once('response', function (response) {
        var statusCode = response.statusCode
        if (ACCEPTABLE_STATUS.includes(statusCode)) {
          callback()
        } else {
          var message = homepage + ' responded ' + statusCode
          var error = new Error(message)
          error.userMessage = message
          callback(error)
        }
      })
      .end()
  }
}
