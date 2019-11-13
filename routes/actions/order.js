var assert = require('assert')
var readOffer = require('../../data/read-offer')
var runParallel = require('run-parallel')
var writeOrder = require('../../data/write-order')

exports.properties = {
  licensee: require('./common/name'),
  jurisdiction: require('./common/jurisdiction'),
  email: require('./common/email'),
  person: require('./common/person'),
  offers: {
    type: 'array',
    minItems: 1,
    maxItems: 100,
    items: require('./common/offer-id')
  }
}

exports.handler = function (log, body, end, fail, lock) {
  assert.strict.equal(typeof body, 'object')
  assert.strict.equal(typeof end, 'function')
  assert.strict.equal(typeof fail, 'function')
  assert.strict.equal(typeof lock, 'function')
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
        if (error.userMessage) return fail(error.userMessage)
        log.error(error)
        return fail('internal error')
      }
      var retracted = offers.filter(function (offer) {
        return offer.retracted
      })
      if (retracted.length !== 0) {
        return fail(
          'retracted offers: ' +
          retracted.map(offerIDOf).join(', ')
        )
      }
      var relicensed = offers.filter(function (offer) {
        return offer.relicensed
      })
      if (relicensed.length !== 0) {
        return fail(
          'relicensed offers: ' +
          relicensed.map(offerIDOf).join(', ')
        )
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
        if (error) return fail('internal error')
        end({ location: '/pay/' + orderID })
      })
    }
  )
}

function offerIDOf (argument) {
  return argument.offerID
}
