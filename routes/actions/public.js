var decode = require('../../data/decode')
var ed25519 = require('ed25519')
var encode = require('../../data/encode')
var publicLicense = require('../../forms/public-license')
var readProduct = require('../../data/read-product')
var stringify = require('../../stringify')

exports.properties = {
  licensorID: require('./common/licensor-id'),
  password: {type: 'string'},
  productID: require('./common/product-id')
}

exports.handler = function (body, service, end, fail, lock) {
  var licensorID = body.licensorID
  var productID = body.productID
  readProduct(service, productID, function (error, product) {
    if (error) {
      /* istanbul ignore else */
      if (error.userMessage) {
        fail(error.userMessage)
      } else {
        service.log.error(error)
        fail('internal error')
      }
    } else {
      if (product.retracted) {
        fail('retracted product')
      } else {
        var licenseData = {
          grace: product.grace,
          jurisdiction: product.licensor.jurisdiction,
          licensorID: licensorID,
          name: product.licensor.name,
          productID: productID,
          publicKey: product.licensor.publicKey,
          version: publicLicense.VERSION
        }
        var document = publicLicense(licenseData)
        var licensorLicenseSignature = encode(
          ed25519.Sign(
            Buffer.from(document, 'utf8'),
            decode(body.licensor.privateKey)
          )
        )
        var agentLicenseSignature = encode(
          ed25519.Sign(
            Buffer.from(
              document + '---\nLicensor:\n' +
              signatureLines(licensorLicenseSignature) + '\n',
              'utf8'
            ),
            service.privateKey
          )
        )
        var licensorMetadataSignature = encode(
          ed25519.Sign(
            Buffer.from(stringify(licenseData), 'utf8'),
            decode(body.licensor.privateKey)
          )
        )
        var agentMetadataSiganture = encode(
          ed25519.Sign(
            Buffer.from(stringify({
              license: licenseData,
              licensorSignature: licensorMetadataSignature
            }), 'utf8'),
            service.privateKey
          )
        )
        end({
          license: {
            document: document,
            licensorSignature: licensorLicenseSignature,
            agentSignature: agentLicenseSignature
          },
          metadata: {
            licensezero: {
              license: licenseData,
              licensorSignature: licensorMetadataSignature,
              agentSignature: agentMetadataSiganture
            }
          }
        })
      }
    }
  })
}

function signatureLines (signature) {
  return [
    signature.slice(0, 32),
    signature.slice(32, 64),
    signature.slice(64, 96),
    signature.slice(96)
  ].join('\n')
}
