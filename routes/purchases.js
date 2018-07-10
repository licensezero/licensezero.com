var purchasePath = require('../paths/purchase')
var fs = require('fs')
var UUID = new RegExp(require('../data/uuidv4-pattern'))

module.exports = function (request, response) {
  var purchaseID = request.parameters.purchaseID
  if (!UUID.test(purchaseID)) {
    response.statusCode = 404
    return response.end()
  }
  response.setHeader('Content-Type', 'application/json; charset=UTF-8')
  fs.createReadStream(purchasePath(purchaseID))
    .once('error', function (error) {
      if (error.code === 'ENOENT') {
        response.statusCode = 404
        response.end()
      } else {
        response.statusCode = 500
        response.end()
      }
    })
    .pipe(response)
}
