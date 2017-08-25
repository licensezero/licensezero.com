var decode = require('../../data/decode')
var ed25519 = require('ed25519')
var encode = require('../../data/encode')
var lamos = require('lamos')
var readProduct = require('../../data/read-product')
var recordSignature = require('../../data/record-signature')
var waiver = require('../../forms/waiver')

exports.properties = {
  licensorID: require('./common/licensor-id'),
  password: {type: 'string'},
  productID: require('./common/product-id'),
  beneficiary: {
    description: 'beneficiary legal name',
    type: 'string',
    minLength: 4
  },
  term: {
    oneOf: [
      {
        description: 'term of waiver, in calendar days',
        type: 'integer',
        min: 7, // 7 days
        max: 3650 // 10 years
      },
      {
        description: 'waive forever',
        type: 'string',
        const: 'forever'
      }
    ]
  }
}

exports.handler = function (body, service, end, fail, lock) {
  var productID = body.productID
  readProduct(service, productID, function (error, product) {
    if (error) {
      if (error.userMessage) {
        fail(error.userMessage)
      } else {
        fail(error)
      }
    } else {
      if (product.retracted) {
        fail('retracted product')
      } else {
        var licensor = product.licensor
        var parameters = {
          FORM: 'waiver',
          VERSION: waiver.version,
          name: licensor.name,
          jurisdiction: licensor.jurisdiction,
          repository: product.repository,
          product: productID,
          description: product.description,
          beneficiary: body.beneficiary,
          date: new Date().toISOString(),
          term: body.term.toString()
        }
        var manifest = lamos.stableStringify(parameters)
        var document = waiver(parameters)
        var signature = encode(
          ed25519.Sign(
            Buffer.from(manifest + '\n\n' + document),
            decode(licensor.privateKey)
          )
        )
        recordSignature(
          service, licensor.publicKey, signature,
          function (error, done) {
            if (error) {
              service.log.error(error)
              fail('internal error')
            } else {
              end({
                manifest: manifest,
                document: document,
                signature: signature
              })
            }
          }
        )
      }
    }
  })
}
