var http = require('http-https')
var url = require('url')

var TESTING = process.env.NODE_ENV === 'test'

module.exports = function (body, callback) {
  if (
    TESTING &&
    body.repository.indexOf('http://example.com/') === 0
  ) {
    return callback()
  }
  var repository = body.repository
  var options = url.parse(repository)
  options.method = 'HEAD'
  http.request(options)
    .once('error', function (error) {
      error.userMessage = 'could not HEAD repository'
      callback(error)
    })
    .once('response', function (response) {
      var statusCode = response.statusCode
      if (statusCode === 200 || statusCode === 204) {
        callback()
      } else {
        var message = repository + ' responded ' + statusCode
        var error = new Error(message)
        error.userMessage = message
        callback(error)
      }
    })
    .end()
}
