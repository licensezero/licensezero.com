var UUIDV4 = require('../../data/uuidv4-pattern')
var fs = require('fs')
var productPath = require('../../paths/product')

exports.schema = {
  type: 'object',
  properties: {
    id: {
      description: 'licensor id',
      type: 'string',
      pattern: UUIDV4
    },
    password: {
      type: 'string'
    },
    product: {
      description: 'product id',
      type: 'string',
      pattern: UUIDV4
    }
  },
  additionalProperties: false,
  required: ['id', 'password', 'product']
}

exports.handler = function (body, service, end, fail, lock) {
  lock(body.product, function (release) {
    var file = productPath(service, body.product)
    fs.unlink(file, release(function (error) {
      if (error) {
        if (error.code === 'ENOENT') {
          fail('no such product')
        } else {
          service.log.error(error)
          fail('internal error')
        }
      } else {
        end()
      }
    }))
  })
}
