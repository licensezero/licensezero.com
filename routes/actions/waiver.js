var ed25519 = require('../../util/ed25519')
var last = require('../../util/last')
var readProject = require('../../data/read-project')
var recordSignature = require('../../data/record-signature')
var stringify = require('json-stable-stringify')
var waiver = require('../../forms/waiver')

exports.properties = {
  licensorID: require('./common/licensor-id'),
  token: { type: 'string' },
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

exports.handler = function (log, body, end, fail, lock) {
  var projectID = body.projectID
  readProject(projectID, function (error, project) {
    if (error) {
      if (error.userMessage) return fail(error.userMessage)
      return fail(error)
    }
    if (project.retracted) return fail('retracted project')
    var licensor = project.licensor
    var parameters = {
      FORM: 'waiver',
      VERSION: waiver.version,
      beneficiary: {
        name: body.beneficiary,
        jurisdiction: body.jurisdiction
      },
      licensor: {
        name: last(licensor.name),
        jurisdiction: last(licensor.jurisdiction)
      },
      project: {
        projectID,
        description: project.description,
        homepage: project.homepage
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
            projectID,
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
