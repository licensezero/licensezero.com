var ed25519 = require('../../util/ed25519')
var stringify = require('json-stable-stringify')
var readOffer = require('../../data/read-offer')
var recordSignature = require('../../data/record-signature')
var waiver = require('../../forms/waiver')

exports.properties = {
  licensorID: require('./common/licensor-id'),
  token: { type: 'string' },
  offerID: require('./common/offer-id'),
  beneficiary: {
    description: 'beneficiary legal name',
    type: 'string',
    minLength: 4
  },
  jurisdiction: require('./common/jurisdiction'),
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

exports.handler = function (log, body, end, fail, lock) {
  var offerID = body.offerID
  readOffer(offerID, function (error, offer) {
    if (error) {
      if (error.userMessage) return fail(error.userMessage)
      return fail(error)
    }
    if (offer.retracted) return fail('retracted offer')
    var licensor = offer.licensor
    var parameters = {
      terms: 'waiver',
      version: waiver.version,
      beneficiary: {
        name: body.beneficiary,
        jurisdiction: body.jurisdiction
      },
      licensor: {
        name: licensor.name,
        jurisdiction: licensor.jurisdiction
      },
      offer: {
        offerID,
        description: offer.description,
        url: offer.url
      },
      date: new Date().toISOString(),
      term: body.term.toString()
    }
    var manifest = stringify(parameters)
    waiver(parameters, function (error, document) {
      if (error) {
        log.error(error)
        return fail('internal error')
      }
      var signature = ed25519.sign(
        manifest + '\n\n' + document,
        licensor.publicKey,
        licensor.privateKey
      )
      recordSignature(
        licensor.publicKey, signature,
        function (error, done) {
          if (error) {
            log.error(error)
            return fail('internal error')
          }
          end({
            offerID,
            manifest,
            document,
            signature,
            publicKey: licensor.publicKey
          })
        }
      )
    })
  })
}
