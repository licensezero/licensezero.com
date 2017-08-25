var mutateJSONFile = require('../../data/mutate-json-file')
var productPath = require('../../paths/product')

exports.properties = {
  licensorID: require('./common/licensor-id'),
  password: {type: 'string'},
  productID: require('./common/product-id'),
  pricing: require('./common/pricing')
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
