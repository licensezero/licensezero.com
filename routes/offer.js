var JURISDICTIONS = require('../data/jurisdictions')
var ecb = require('ecb')
var path = require('path')
var UUIDV4 = require('../data/uuidv4-pattern')
var fs = require('fs')
var http = require('http-https')
var mkdirp = require('mkdirp')
var productPath = require('../path/product')
var runSeries = require('run-series')
var url = require('url')
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
  runSeries([
    function checkRepository (done) {
      var repository = body.repository
      var options = url.parse(repository)
      options.method = 'HEAD'
      http.request(options)
        .once('error', function (error) {
          error.userMessage = 'could not HEAD repository'
          done(error)
        })
        .once('response', function (response) {
          var statusCode = response.statusCode
          if (statusCode === 200 || statusCode === 204) {
            done()
          } else {
            var message = repository + ' responded ' + statusCode
            var error = new Error(message)
            error.userMessage = message
            done(error)
          }
        })
    },
    function writeProductFile (done) {
      var product = uuid()
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
