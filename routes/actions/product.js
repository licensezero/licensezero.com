var UUIDV4 = require('../../data/uuidv4-pattern')
var readProduct = require('../../data/read-product')
var sanitizeProduct = require('../../data/sanitize-product')

exports.schema = {
  properties: {
    product: {
      description: 'product id',
      type: 'string',
      pattern: UUIDV4
    }
  }
}

exports.handler = function (body, service, end, fail) {
  readProduct(service, body.product, function (error, data) {
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
