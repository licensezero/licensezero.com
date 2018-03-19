var mutateJSONFile = require('../../data/mutate-json-file')
var projectPath = require('../../paths/project')
var readJSONFile = require('../../data/read-json-file')

exports.properties = {
  licensorID: require('./common/licensor-id'),
  token: {type: 'string'},
  projectID: require('./common/project-id'),
  unlock: {
    type: 'string',
    format: 'date-time'
  }
}

exports.handler = function (body, service, end, fail, lock) {
  lock([body.licensorID, body.projectID], function (release) {
    var file = projectPath(service, body.projectID)
    readJSONFile(file, function (error, project) {
      if (error) return die('no such project')
      if (project.retracted) return die('retracted project')
      if (project.relicensed) return die('relicensed project')
      // Unlock Date Validation
      var proposedUnlock = new Date(body.unlock)
      var minimumUnlock = minimumUnlockDate()
      if (proposedUnlock < minimumUnlock) return die('invalid unlock')
      // If the project is already locked, ensure the
      // proposed lock date is after the current unlock date.
      if (project.lock) {
        var currentUnlock = new Date(project.lock.unlock)
        if (currentUnlock >= proposedUnlock) {
          return die('already locked')
        }
      }
      mutateJSONFile(file, function (data) {
        data.lock = {
          locked: new Date().toISOString(),
          unlock: proposedUnlock.toISOString(),
          price: project.pricing.private
        }
      }, release(function (error) {
        if (error) {
          service.log.error(error)
          return fail('internal error')
        } else {
          end()
        }
      }))
    })
    function die (message) {
      release(function () {
        fail(message)
      })()
    }
  })
}

var MINIMUM_LOCK_DAYS = 7

function minimumUnlockDate () {
  var returned = new Date()
  returned.setDate(returned.getDate() + MINIMUM_LOCK_DAYS)
  return returned
}
