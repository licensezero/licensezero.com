var JURISDICTIONS = require('../../data/jurisdictions')
var UUIDV4 = require('../../data/uuidv4-pattern')
var checkRepository = require('./check-repository')
var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')
var productPath = require('../../paths/product')
var productsListPath = require('../../paths/products-list')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var stringifyProducts = require('../../data/stringify-products')
var uuid = require('uuid/v4')
var without = require('../../data/without')

var properties = {
  id: {
    description: 'licensor id',
    type: 'string',
    pattern: UUIDV4
  },
  password: {
    type: 'string'
  },
  repository: {
    description: 'source code repository',
    type: 'string',
    format: 'uri',
    pattern: '^(https|http)://'
  },
  price: {
    description: 'price per license, in United States cents',
    type: 'integer',
    min: 50, // 50 cents
    max: 100000 // 1,000 dollars
  },
  term: {
    description: 'term of paid licenses, in calendar days',
    type: 'integer',
    min: 90, // 90 days
    max: 3650 // 10 years
  },
  grace: {
    description: 'number of calendar days grace period',
    type: 'integer',
    min: 7, // one week
    max: 365 // one year
  },
  jurisdictions: {
    type: 'array',
    minItems: 1,
    items: {
      type: 'string',
      enum: JURISDICTIONS
    }
  },
  preorder: {
    description: 'whether to allow preorders for lifetime licenses',
    type: 'boolean'
  },
  terms: {
    type: 'string',
    const: 'I agree with the latest public terms of service.'
  }
}

exports.schema = {
  type: 'object',
  properties: properties,
  additionalProperties: false,
  required: Object.keys(properties)
}

exports.handler = function (body, service, end, fail, lock) {
  var id = body.id
  var product = uuid()
  lock([body.id], function (release) {
    runSeries([
      checkRepository.bind(null, body),
      function writeFile (done) {
        runParallel([
          function writeProductFile (done) {
            var file = productPath(service, product)
            var content = without(body, ['licensor'])
            runSeries([
              mkdirp.bind(null, path.dirname(file)),
              fs.writeFile.bind(fs, file, JSON.stringify(content))
            ], done)
          },
          function (done) {
            var file = productsListPath(service, id)
            var content = stringifyProducts([
              {
                product: product,
                offered: new Date().toISOString(),
                retracted: null
              }
            ])
            runSeries([
              mkdirp.bind(null, path.dirname(file)),
              fs.appendFile.bind(fs, file, content)
            ], done)
          }
        ], done)
      }
    ], release(function (error) {
      /* istanbul ignore if */
      if (error) {
        service.log.error(error)
        /* istanbul ignore else */
        if (error.userMessage) {
          fail(error.userMessage)
        } else {
          fail('internal error')
        }
      } else {
        end({product: product})
      }
    }))
  })
}
