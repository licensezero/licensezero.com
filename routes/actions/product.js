var readProduct = require('../../data/read-product')
var sanitizeProduct = require('../../data/sanitize-product')

exports.properties = {
  productID: require('./common/product-id')
}

exports.handler = function (body, service, end, fail) {
  readProduct(service, body.productID, function (error, data) {
    if (error) {
      service.log.error(error)
      /* istanbul ignore else */
      if (error.userMessage) {
        fail(error.userMessage)
      } else {
        fail('internal error')
      }
    } else {
      sanitizeProduct(data)
      end(data)
    }
  })
}
