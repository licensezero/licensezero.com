var ed25519 = require('../../ed25519')
var stringify = require('../../stringify')
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
          productID: productID,
          description: product.description,
          beneficiary: body.beneficiary,
          date: new Date().toISOString(),
          term: body.term.toString()
        }
        var manifest = stringify(parameters)
        var document = waiver(parameters)
        var signature = ed25519.sign(
          manifest + '\n\n' + document,
          licensor.privateKey
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
