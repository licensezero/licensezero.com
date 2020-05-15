var last = require('../../util/last')
var listOffers = require('../../data/list-offers')
var readDeveloper = require('../../data/read-developer')

exports.properties = {
  developerID: require('./common/developer-id')
}

exports.handler = function (log, body, end, fail) {
  var developerID = body.developerID
  readDeveloper(developerID, function (error, developer) {
    if (error) {
      /* istanbul ignore else */
      if (error.code === 'ENOENT') return fail('no such developer')
      return fail('internal error')
    }
    listOffers(developerID, function (error, offers) {
      /* istanbul ignore if */
      if (error) {
        log.error(error)
        return fail('internal error')
      }
      end({
        name: last(developer.name),
        jurisdiction: last(developer.jurisdiction),
        offers
      })
    })
  })
}
