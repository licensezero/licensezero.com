var last = require('../../util/last')
var listOffers = require('../../data/list-offers')
var readLicensor = require('../../data/read-licensor')

exports.properties = {
  licensorID: require('./common/licensor-id')
}

exports.handler = function (log, body, end, fail) {
  var licensorID = body.licensorID
  readLicensor(licensorID, function (error, licensor) {
    if (error) {
      /* istanbul ignore else */
      if (error.code === 'ENOENT') return fail('no such licensor')
      return fail('internal error')
    }
    listOffers(licensorID, function (error, offers) {
      /* istanbul ignore if */
      if (error) {
        log.error(error)
        return fail('internal error')
      }
      end({
        name: last(licensor.name),
        jurisdiction: last(licensor.jurisdiction),
        offers
      })
    })
  })
}
