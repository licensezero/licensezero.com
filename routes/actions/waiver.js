var UUIDV4 = require('../../data/uuidv4-pattern')
var decode = require('../../data/decode')
var ed25519 = require('ed25519')
var encode = require('../../data/encode')
var readProduct = require('../../data/read-product')
var recordSignature = require('../../data/record-signature')
var waiver = require('../../forms/waiver')

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
    product: {
      description: 'product id',
      type: 'string',
      pattern: UUIDV4
    },
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
}

exports.handler = function (body, service, end, fail, lock) {
  var productID = body.product
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
        var document = waiver({
          name: licensor.name,
          jurisdiction: licensor.jurisdiction,
          repository: product.repository,
          product: productID,
          beneficiary: body.beneficiary,
          date: new Date().toISOString(),
          term: body.term
        })
        var signature = encode(
          ed25519.Sign(
            Buffer.from(document, 'ascii'),
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
