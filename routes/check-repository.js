var http = require('http-https')
var url = require('url')

module.exports = function (body, callback) {
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
}
