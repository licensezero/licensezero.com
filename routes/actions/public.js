var decode = require('../../data/decode')
var ed25519 = require('ed25519')
var encode = require('../../data/encode')
var publicLicense = require('../../forms/public-license')
var readProduct = require('../../data/read-product')

exports.schema = {
  properties: {
    licensorID: require('./offer').schema.properties.licensorID,
    password: {
      type: 'string'
    },
    productID: require('./product').schema.properties.productID
  }
}

exports.handler = function (body, service, end, fail, lock) {
  var productID = body.productID
  readProduct(service, productID, function (error, product) {
    if (error) {
      /* istanbul ignore else */
      if (error.userMessage) {
        fail(error.userMessage)
      } else {
        service.log.error(error)
        fail('internal error')
      }
    } else {
      if (product.retracted) {
        fail('retracted product')
      } else {
        var document = publicLicense({
          name: product.licensor.name,
          publicKey: product.licensor.publicKey,
          grace: product.grace,
          term: product.term,
          product: productID
        })
        end({
          document: document,
          signature: encode(
            ed25519.Sign(
              Buffer.from(document, 'ascii'),
              decode(service.privateKey)
            )
          )
        })
      }
    }
  })
}
