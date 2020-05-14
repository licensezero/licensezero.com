var Busboy = require('busboy')
var ajv = require('./ajv')
var internalError = require('./internal-error')
var readOffer = require('../data/read-offer')
var runParallel = require('run-parallel')
var writeOrder = require('../data/write-order')

var schema = {
  licensee: require('./actions/common/name'),
  jurisdiction: require('./actions/common/jurisdiction'),
  email: require('./actions/common/email'),
  person: require('./actions/common/person'),
  offers: {
    type: 'array',
    minItems: 1,
    maxItems: 100,
    items: require('./actions/common/offer-id')
  }
}

var validate = ajv.compile(schema)

module.exports = function (request, response) {
  var method = request.method
  if (method === 'POST') {
    post.apply(null, arguments)
  } else {
    response.statusCode = 405
    response.end()
  }
}

function post (request, response) {
  var data = {}
  var parser = new Busboy({ headers: request.headers })
  parser.on('field', function (name, value) {
    var keys = Object.keys(schema)
    var arrayKeys = []
    var otherKeys = []
    keys.forEach(function (key) {
      if (schema[key].type === 'array') {
        arrayKeys.push(key + '[]')
      } else {
        otherKeys.push(key)
      }
    })
    if (arrayKeys.includes(name)) {
      var key = name.slice(0, -2)
      if (data[name]) {
        data[key].push(value)
      } else {
        data[key] = [value]
      }
    } else if (otherKeys.includes(name)) {
      data[name] = value
    }
  })
  data.action = 'order'
  parser.once('finish', function () {
    request.log.info('finished parsing body')
    order(request.log, data, function (error, location) {
      if (error) return internalError(request, response, error)
      response.statusCode = 303
      response.setHeader('Location', location)
      response.end()
    })
  })
  request.pipe(parser)
}

function order (log, body, callback) {
  if (!validate(body)) {
    var error = new Error('invalid body')
    return callback(error)
  }
  var offers = body.offers
  runParallel(
    offers.map(function (offerID, index) {
      return function (done) {
        readOffer(offerID, function (error, offer) {
          if (error) {
            if (error.userMessage) {
              error.userMessage += ': ' + offerID
            }
            return done(error)
          }
          offers[index] = offer
          done()
        })
      }
    }),
    function (error) {
      if (error) {
        /* istanbul ignore else */
        if (error.userMessage) return callback(error.userMessage)
        log.error(error)
        return callback(new Error('internal error'))
      }
      var retracted = offers.filter(function (offer) {
        return offer.retracted
      })
      if (retracted.length !== 0) {
        return callback(new Error(
          'retracted offers: ' +
          retracted.map(offerIDOf).join(', ')
        ))
      }
      var relicensed = offers.filter(function (offer) {
        return offer.relicensed
      })
      if (relicensed.length !== 0) {
        return callback(new Error(
          'relicensed offers: ' +
          relicensed.map(offerIDOf).join(', ')
        ))
      }
      var pricedOffers = offers.map(function (offer) {
        offer.price = offer.pricing.private
        delete offer.pricing
        return offer
      })
      writeOrder({
        offers: pricedOffers,
        licensee: body.licensee,
        jurisdiction: body.jurisdiction,
        email: body.email
      }, function (error, orderID) {
        if (error) return callback(new Error('internal error'))
        callback(null, '/pay/' + orderID)
      })
    }
  )
}

function offerIDOf (argument) {
  return argument.offerID
}
