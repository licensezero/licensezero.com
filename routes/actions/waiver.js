var UUIDV4 = require('../../data/uuidv4-pattern')
var decode = require('../../data/decode')
var ed25519 = require('ed25519')
var encode = require('../../data/encode')
var fs = require('fs')
var parseJSON = require('json-parse-errback')
var productPath = require('../../paths/product')
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
  fs.readFile(productPath(service, product), function (error, buffer) {
    if (error) {
      /* istanbul ignore else */
      if (error.code === 'ENOENT') {
        fail('no such product')
      } else {
        service.log.error(error)
        fail('internal error')
      }
    } else {
      parseJSON(buffer, function (error, parsed) {
        /* istanbul ignore if */
        if (error) {
          service.log.error(error)
          fail('internal error')
        } else {
          if (parsed.retracted) {
            fail('retracted product')
          } else {
            var document = waiver({
              name: licensor.name,
              jurisdiction: licensor.jurisdiction,
              id: id,
              repository: parsed.repository,
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
  })
}
