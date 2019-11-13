var readOffer = require('../../data/read-offer')
var writeRelicenseOrder = require('../../data/write-relicense-order')

exports.properties = {
  offerID: require('./common/offer-id'),
  sponsor: require('./common/name'),
  jurisdiction: require('./common/jurisdiction'),
  email: require('./common/email')
}

exports.handler = function (log, body, end, fail, lock) {
  var offerID = body.offerID
  var sponsor = body.sponsor
  var jurisdiction = body.jurisdiction
  var email = body.email
  readOffer(offerID, function (error, offer) {
    if (error) return fail('no such offer')
    if (offer.retracted) return fail('offer retracted')
    if (offer.relicensed) return fail('offer already relicensed')
    if (!offer.pricing.relicense) return fail('not available for relicense')
    writeRelicenseOrder({
      offer,
      sponsor,
      jurisdiction,
      email
    }, function (error, orderID) {
      if (error) return fail('internal error')
      end({ location: '/pay/' + orderID })
    })
  })
}
