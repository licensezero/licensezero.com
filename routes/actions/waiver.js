var UUIDV4 = require('../../data/uuidv4-pattern')
var decode = require('../../data/decode')
var ed25519 = require('ed25519')
var encode = require('../../data/encode')
var readProduct = require('../../data/read-product')
var waiver = require('../../forms/waiver')

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
  },
  additionalProperties: false,
  required: ['id', 'password', 'product', 'beneficiary', 'term']
}

exports.handler = function (body, service, end, fail, lock) {
  var product = body.product
  var id = body.id
  var licensor = body.licensor
  readProduct(service, product, function (error, data) {
    if (error) {
      if (error.userMessage) {
        fail(error.userMessage)
      } else {
        fail(error)
      }
    } else {
      if (data.retracted) {
        fail('retracted product')
      } else {
        var document = waiver({
          name: licensor.name,
          jurisdiction: licensor.jurisdiction,
          id: id,
          repository: data.repository,
          product: body.product,
          beneficiary: body.beneficiary,
          date: new Date().toISOString(),
          term: body.term
        })
        end({
          document: document,
          signature: encode(
            ed25519.Sign(
              Buffer.from(document, 'ascii'),
              decode(licensor.privateKey)
            )
          )
        })
      }
    }
  })
}
