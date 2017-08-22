var JURISDICTIONS = require('../data/jurisdictions')
var UUIDV4 = require('../data/uuidv4-pattern')
var checkRepository = require('./check-repository')
var ecb = require('ecb')
var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')
var productPath = require('../paths/product')
var runSeries = require('run-series')
var uuid = require('uuid/v4')
var without = require('../data/without')

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
  var product = uuid()
  runSeries([
    checkRepository.bind(null, body),
    function writeProductFile (done) {
      var file = productPath(service, body.id, product)
      var content = without(body, 'licensor')
      runSeries([
        mkdirp.bind(null, path.dirname(file)),
        fs.writeFile.bind(fs, file, JSON.stringify(content))
      ], ecb(done, done.bind(null, null, product)))
    }
  ], function (error, product) {
    if (error) {
      service.log.error(error)
      fail(error.userMessage || 'internal error')
    } else {
      end({product: product})
    }
  })
}
