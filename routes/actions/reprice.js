var UUIDV4 = require('../../data/uuidv4-pattern')
var mutateJSONFile = require('../../data/mutate-json-file')
var productPath = require('../../paths/product')

exports.schema = {
  properties: {
    licensor: {
      description: 'licensor id',
      type: 'string',
      pattern: UUIDV4
    },
    password: {
      type: 'string'
    },
    product: require('./retract').schema.properties.product,
    pricing: require('./offer').schema.properties.pricing
  }
}

exports.handler = function (body, service, end, fail, lock) {
  lock([body.licensor.licensorID, body.product], function (release) {
    var file = productPath(service, body.product)
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
