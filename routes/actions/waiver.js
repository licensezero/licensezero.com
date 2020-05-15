var ed25519 = require('../../util/ed25519')
var last = require('../../util/last')
var readOffer = require('../../data/read-offer')
var recordSignature = require('../../data/record-signature')
var stringify = require('json-stable-stringify')
var waiver = require('../../forms/waiver')

exports.properties = {
  developerID: require('./common/developer-id'),
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
    var developer = offer.developer
    var parameters = {
      FORM: 'waiver',
      VERSION: waiver.version,
      beneficiary: {
        name: body.beneficiary,
        jurisdiction: body.jurisdiction
      },
      developer: {
        name: last(developer.name),
        jurisdiction: last(developer.jurisdiction)
      },
      offer: {
        offerID,
        description: offer.description,
        homepage: offer.homepage
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
        Buffer.from(process.env.PUBLIC_KEY, 'hex'),
        Buffer.from(process.env.PRIVATE_KEY, 'hex')
      )
      recordSignature(
        process.env.PUBLIC_KEY, signature,
        function (error, done) {
          if (error) {
            log.error(error)
            return fail('internal error')
          }
          end({
            offerID,
            metadata: parameters,
            document,
            signature,
            publicKey: process.env.PUBLIC_KEY
          })
        }
      )
    })
  })
}
