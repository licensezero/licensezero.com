var annotateENOENT = require('./annotate-enoent')
var offerPath = require('../paths/offer')
var readJSONFile = require('./read-json-file')
var readDeveloper = require('./read-developer')
var runWaterfall = require('run-waterfall')

module.exports = function (offerID, callback) {
  runWaterfall([
    function readOfferData (done) {
      var file = offerPath(offerID)
      readJSONFile(file, annotateENOENT('no such offer', done))
    },
    function readDeveloperData (offer, done) {
      readDeveloper(offer.developer, function (error, developer) {
        if (error) return done(error)
        done(null, { developer, offer })
      })
    }
  ], function (error, results) {
    if (error) return callback(error)
    callback(null, Object.assign(results.offer, {
      developer: results.developer
    }))
  })
}
