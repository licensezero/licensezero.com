var UUIDV4 = require('../../data/uuidv4-pattern')
var decode = require('../../data/decode')
var ed25519 = require('ed25519')
var encode = require('../../data/encode')
var publicLicense = require('../../forms/public-license')
var readProduct = require('../../data/read-product')

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
  var product = body.product
  readProduct(service, product, function (error, data) {
    if (error) {
      /* istanbul ignore else */
      if (error.userMessage) {
        fail(error.userMessage)
      } else {
        service.log.error(error)
        fail('internal error')
      }
    } else {
      if (data.retracted) {
        fail('retracted product')
      } else {
        var document = publicLicense({
          name: data.licensor.name,
          publicKey: data.licensor.publicKey,
          grace: data.grace,
          term: data.term,
          product: product
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
