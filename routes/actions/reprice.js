var mutateJSONFile = require('../../data/mutate-json-file')
var productPath = require('../../paths/product')

exports.schema = {
  properties: {
    licensorID: require('./offer').schema.properties.licensorID,
    password: {
      type: 'string'
    },
    productID: require('./product').schema.properties.productID,
    pricing: require('./offer').schema.properties.pricing
  }
}

exports.handler = function (body, service, end, fail, lock) {
  lock([body.licensorID, body.productID], function (release) {
    var file = productPath(service, body.productID)
    mutateJSONFile(file, function (data) {
      data.pricing = body.pricing
    }, release(function (error) {
      if (error) {
        service.log.error(error)
        return fail('internal error')
      } else {
        end()
      }
    }))
  })
}
