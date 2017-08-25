var UUIDV4 = require('../../data/uuidv4-pattern')
var licensorPath = require('../../paths/licensor')
var listProduts = require('../../data/list-products')
var readJSONFile = require('../../data/read-json-file')

exports.schema = {
  properties: {
    licensor: {
      description: 'licensor id',
      type: 'string',
      pattern: UUIDV4
    }
  }
}

exports.handler = function (body, service, end, fail) {
  var licensorID = body.licensor
  var file = licensorPath(service, licensorID)
  readJSONFile(file, function (error, licensor) {
    if (error) {
      /* istanbul ignore else */
      if (error.code === 'ENOENT') {
        fail('no such licensor')
      } else {
        fail('internal error')
      }
    } else {
      listProduts(service, licensorID, function (error, products) {
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
