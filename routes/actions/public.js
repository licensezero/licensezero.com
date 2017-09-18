var ed25519 = require('../../ed25519')
var noncommercialLicense = require('../../forms/noncommercial-license')
var readProject = require('../../data/read-project')
var stringify = require('../../stringify')

exports.properties = {
  licensorID: require('./common/licensor-id'),
  token: {type: 'string'},
  projectID: require('./common/project-id')
}

exports.handler = function (body, service, end, fail, lock) {
  var projectID = body.projectID
  readProject(service, projectID, function (error, project) {
    if (error) {
      /* istanbul ignore else */
      if (error.userMessage) {
        fail(error.userMessage)
      } else {
        service.log.error(error)
        fail('internal error')
      }
    } else {
      if (project.retracted) {
        fail('retracted project')
      } else {
        var licenseData = {
          jurisdiction: project.licensor.jurisdiction,
          name: project.licensor.name,
          projectID: projectID,
          publicKey: project.licensor.publicKey,
          version: noncommercialLicense.VERSION
        }
        noncommercialLicense(licenseData, function (error, document) {
          if (error) {
            service.log.error(error)
            return fail('internal error')
          }
          var licensorLicenseSignature = ed25519.sign(
            document, body.licensor.publicKey, project.licensor.privateKey
          )
          var agentLicenseSignature = ed25519.sign(
            document + '---\nLicensor:\n' +
            signatureLines(licensorLicenseSignature) + '\n',
            service.publicKey,
            service.privateKey
          )
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
            service.publicKey,
            service.privateKey
          )
          end({
            license: {
              document: document,
              licensorSignature: licensorLicenseSignature,
              agentSignature: agentLicenseSignature
            },
            metadata: {
              // See: https://docs.npmjs.com/files/package.json#license
              // TODO: Replace w/ SPDX identifier.
              license: 'SEE LICENSE IN LICENSE',
              licensezero: {
                license: licenseData,
                licensorSignature: licensorMetadataSignature,
                agentSignature: agentMetadataSiganture
              }
            }
          })
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
