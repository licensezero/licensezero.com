var Busboy = require('busboy')
var internalError = require('./internal-error')
var invokeAction = require('./invoke-action')
var orderAction = require('./actions/order')
var orderProperties = require('./actions/order').properties

module.exports = function (request, response) {
  var method = request.method
  if (method === 'POST') {
    post.apply(null, arguments)
  } else {
    response.statusCode = 405
    response.end()
  }
}

function post (request, response) {
  var data = {}
  var parser = new Busboy({headers: request.headers})
  parser.on('field', function (name, value) {
    var keys = Object.keys(orderProperties)
    var arrayKeys = []
    var otherKeys = []
    keys.forEach(function (key) {
      if (orderProperties[key].type === 'array') {
        arrayKeys.push(key + '[]')
      } else {
        otherKeys.push(key)
      }
    })
    if (arrayKeys.includes(name)) {
      var key = name.slice(0, -2)
      if (data[name]) {
        data[key].push(value)
      } else {
        data[key] = [value]
      }
    } else if (otherKeys.includes(name)) {
      data[name] = value
    }
  })
  data.action = 'order'
  parser.once('finish', function () {
    request.log.info('finished parsing body')
    invokeAction(request.log, orderAction, data, function (error, result) {
      if (error) {
        request.log.error(error)
        return internalError(response, error)
      }
      response.statusCode = 303
      response.setHeader('Location', result.location)
      response.end()
    })
  })
  request.pipe(parser)
}
