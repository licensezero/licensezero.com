var ed25519 = require('../../ed25519')
var stringify = require('../../stringify')
var readProject = require('../../data/read-project')
var recordSignature = require('../../data/record-signature')
var waiver = require('../../forms/waiver')

exports.properties = {
  licensorID: require('./common/licensor-id'),
  token: {type: 'string'},
  projectID: require('./common/project-id'),
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

exports.handler = function (body, service, end, fail, lock) {
  var projectID = body.projectID
  readProject(service, projectID, function (error, project) {
    if (error) {
      if (error.userMessage) {
        fail(error.userMessage)
      } else {
        fail(error)
      }
    } else {
      if (project.retracted) {
        fail('retracted project')
      } else {
        var licensor = project.licensor
        var parameters = {
          FORM: 'waiver',
          VERSION: waiver.version,
          beneficiary: {
            name: body.beneficiary,
            jurisdiction: body.jurisdiction
          },
          licensor: {
            name: licensor.name,
            jurisdiction: licensor.jurisdiction
          },
          project: {
            projectID: projectID,
            description: project.description,
            repository: project.repository
          },
          date: new Date().toISOString(),
          term: body.term.toString()
        }
        var manifest = stringify(parameters)
        waiver(parameters, function (error, document) {
          if (error) {
            service.log.error(error)
            return fail('internal error')
          }
          var signature = ed25519.sign(
            manifest + '\n\n' + document,
            licensor.publicKey,
            licensor.privateKey
          )
          recordSignature(
            service, licensor.publicKey, signature,
            function (error, done) {
              if (error) {
                service.log.error(error)
                fail('internal error')
              } else {
                end({
                  manifest: manifest,
                  document: document,
                  signature: signature
                })
              }
            }
          )
        })
      }
    }
  })
}
