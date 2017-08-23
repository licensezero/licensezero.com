var UUIDV4 = require('../../data/uuidv4-pattern')
var fs = require('fs')
var licensorPath = require('../../paths/licensor')
var listProduts = require('../../data/list-products')
var parseJSON = require('json-parse-errback')

exports.schema = {
  type: 'object',
  properties: {
    id: {
      description: 'licensor id',
      type: 'string',
      pattern: UUIDV4
    }
  },
  required: ['id'],
  additionalProperties: false
}

exports.handler = function (body, service, end, fail) {
  var id = body.id
  var file = licensorPath(service, id)
  fs.readFile(file, function (error, buffer) {
    if (error) {
      /* istanbul ignore else */
      if (error.code === 'ENOENT') {
        fail('no such licensor')
      } else {
        fail('internal error')
      }
    } else {
      parseJSON(buffer, function (error, licensor) {
        /* istanbul ignore if */
        if (error) {
          service.log.error(error)
          fail('internal error')
        } else {
          listProduts(service, id, function (error, products) {
            /* istanbul ignore if */
            if (error) {
              service.log.error(error)
              fail('internal error')
            } else {
              end({
                name: licensor.name,
                jurisdiction: licensor.jurisdiction,
                publicKey: licensor.publicKey,
                products: products
              })
            }
          })
        }
      })
    }
  })
}
