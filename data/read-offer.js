var annotateENOENT = require('./annotate-enoent')
var offerPath = require('../paths/offer')
var readJSONFile = require('./read-json-file')
var readLicensor = require('./read-licensor')
var runWaterfall = require('run-waterfall')

module.exports = function (offerID, callback) {
  runWaterfall([
    function readOfferData (done) {
      var file = offerPath(offerID)
      readJSONFile(file, annotateENOENT('no such offer', done))
    },
    function readLicensorData (offer, done) {
      readLicensor(offer.licensor, function (error, licensor) {
        if (error) return done(error)
        done(null, { licensor, offer })
      })
    }
  ], function (error, results) {
    if (error) return callback(error)
    callback(null, Object.assign(results.offer, {
      licensor: results.licensor
    }))
  })
}
