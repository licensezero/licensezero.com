var ed25519 = require('../../util/ed25519')
var formatPrice = require('../../util/format-price')
var last = require('../../util/last')
var prepareBlanks = require('commonform-prepare-blanks')
var privateLicense = require('../../forms/private-license')
var readOffer = require('../../data/read-offer')
var recordSignature = require('../../data/record-signature')
var stringify = require('json-stable-stringify')
var toCommonMark = require('commonform-commonmark').stringify

exports.properties = {
  developerID: require('./common/developer-id'),
  token: { type: 'string' },
  offerID: require('./common/offer-id'),
  name: require('./common/name'),
  email: require('./common/email'),
  jurisdiction: require('./common/jurisdiction'),
  term: {
    oneOf: [
      {
        description: 'calendar days',
        type: 'integer',
        min: 7, // 7 days
        max: 3650 // 10 years
      },
      {
        description: 'forever',
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
    privateLicense(function (error, parsed) {
      if (error) return fail('unable to read form')
      var parameters = {
        form: 'private license',
        version: parsed.frontMatter.version,
        date: new Date().toISOString(),
        'offer identifier': offer.offerID,
        'project description': offer.description,
        'project repository': offer.homepage,
        'developer name': last(offer.developer.name),
        'developer jurisdiction': last(offer.developer.jurisdiction),
        'developer e-mail': last(offer.developer.email),
        'user name': body.name,
        'user jurisdiction': body.jurisdiction,
        'user e-mail': body.email,
        'agent name': 'Artless Devices LLC',
        'agent jurisdiction': 'US-CA',
        'agent website': 'https://artlessdevices.com',
        term: body.term === 'forever'
          ? 'forever'
          : String(body.term) + ' days',
        price: formatPrice(offer.pricing.private)
      }
      var manifest = stringify(parameters)
      var commonmark = toCommonMark(
        parsed.form,
        prepareBlanks(parameters, parsed.directions),
        {
          title: parsed.frontMatter.title,
          edition: parsed.frontMatter.version
        }
      )
      var signature = ed25519.sign(
        manifest + '\n\n' + commonmark,
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
            commonmark,
            signature,
            publicKey: process.env.PUBLIC_KEY
          })
        }
      )
    })
  })
}
