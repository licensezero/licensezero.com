var UUIDV4 = require('../../data/uuidv4-pattern')
var ecb = require('ecb')
var fs = require('fs')
var productPath = require('../../paths/product')
var productsListPath = require('../../paths/products-list')
var runSeries = require('run-series')

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
  var id = body.id
  lock([product, id], function (release) {
    runSeries([
      function (done) {
        var file = productPath(service, product)
        fs.unlink(file, function (error) {
          if (error && error.code === 'ENOENT') {
            error.userMessage = 'no such product'
          }
          done(error)
        })
      },
      function (done) {
        var file = productsListPath(service, id)
        fs.readFile(file, ecb(done, function (buffer) {
          var filtered = buffer
            .toString()
            .trim()
            .split('\n')
            .filter(function (element) {
              return element !== product && element.length !== 0
            })
            .map(function (element) {
              return element + '\n'
            })
            .join('')
          fs.writeFile(file, filtered, done)
        }))
      }
    ], release(function (error) {
      if (error) {
        service.log.error(error)
        fail(error.userMessage || 'internal error')
      } else {
        end()
      }
    }))
  })
}
