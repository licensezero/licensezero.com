var charityLicense = require('../../forms/charity-license')
var ed25519 = require('../../util/ed25519')
var prosperityLicense = require('../../forms/prosperity-license')
var readOffer = require('../../data/read-offer')
var parityLicense = require('../../forms/parity-license')
var signatureLines = require('../../data/signature-lines')
var stringify = require('json-stable-stringify')

exports.properties = {
  licensorID: require('./common/licensor-id'),
  token: { type: 'string' },
  offerID: require('./common/offer-id'),
  terms: { enum: ['parity', 'prosperity', 'charity'] }
}

exports.handler = function (log, body, end, fail, lock) {
  var offerID = body.offerID
  readOffer(offerID, function (error, offer) {
    if (error) {
      /* istanbul ignore else */
      if (error.userMessage) return fail(error.userMessage)
      log.error(error)
      return fail('internal error')
    }
    if (offer.retracted) return fail('retracted offer')
    var terms = body.terms
    if (body.terms === 'prosperity') terms = prosperityLicense
    if (body.terms === 'parity') terms = parityLicense
    if (body.terms === 'charity') terms = charityLicense
    var licenseData = {
      jurisdiction: offer.licensor.jurisdiction,
      name: offer.licensor.name,
      offerID,
      publicKey: offer.licensor.publicKey,
      terms: body.terms,
      version: terms.version,
      homepage: offer.homepage
    }
    terms(licenseData, function (error, document) {
      if (error) {
        log.error(error)
        return fail('internal error')
      }
      var licensorLicenseSignature = ed25519.sign(
        document, body.licensor.publicKey, offer.licensor.privateKey
      )
      var publicKey = Buffer.from(process.env.PUBLIC_KEY, 'hex')
      var privateKey = Buffer.from(process.env.PRIVATE_KEY, 'hex')
      var agentLicenseSignature = ed25519.sign(
        document + '---\nLicensor:\n' +
        signatureLines(licensorLicenseSignature) + '\n',
        publicKey,
        privateKey
      )
      var metadata = {
        // See: https://docs.npmjs.com/files/package.json#license
        license: 'SEE LICENSE IN LICENSE'
      }
      if (body.terms !== 'charity') {
        var licensorMetadataSignature = ed25519.sign(
          stringify(licenseData),
          body.licensor.publicKey,
          body.licensor.privateKey
        )
        var agentMetadataSiganture = ed25519.sign(
          stringify({
            license: licenseData,
            licensorSignature: licensorMetadataSignature
          }),
          publicKey,
          privateKey
        )
        metadata.licensezero = {
          license: licenseData,
          licensorSignature: licensorMetadataSignature,
          agentSignature: agentMetadataSiganture
        }
      }
      end({
        version: '1.0.0',
        license: {
          document,
          licensorSignature: licensorLicenseSignature,
          agentSignature: agentLicenseSignature
        },
        metadata
      })
    })
  })
}
