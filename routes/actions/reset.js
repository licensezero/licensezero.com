var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')
var randomNonce = require('../../data/random-nonce')
var readLicensor = require('../../data/read-licensor')
var resetTokenPath = require('../../paths/reset-token')
var runSeries = require('run-series')
var runWaterfall = require('run-waterfall')

exports.properties = {
  licensorID: require('./common/licensor-id'),
  email: require('./common/email')
}

exports.handler = function (body, service, end, fail, lock) {
  var licensorID = body.licensorID
  runWaterfall([
    readLicensor.bind(null, service, licensorID),
    function (licensor, done) {
      if (licensor.email !== body.email) {
        return done('invalid body')
      }
      var token = randomNonce()
      runSeries([
        function writeTokenFile (done) {
          var file = resetTokenPath(service, token)
          var content = {
            licensorID: licensorID,
            date: new Date().toISOString()
          }
          runSeries([
            mkdirp.bind(null, path.dirname(file)),
            fs.writeFile.bind(fs, file, JSON.stringify(content))
          ], done)
        },
        function emailLink (done) {
          service.email({
            to: licensor.email,
            subject: 'License Zero Token Reset Link',
            text: [
              'licensezero.com receive a request to reset ' +
              'the access token for licensor number ' +
              licensor.licensorID + '.',
              'If you need to reset your access token ' +
              'use the link below.  If you did not request ' +
              'a token reset, delete this message.',
              'https://licensezero.com/reset/' + token
            ]
          }, done)
        }
      ], done)
    }
  ], function (error) {
    /* istanbul ignore if */
    if (error) {
      service.log.error(error)
      /* istanbul ignore else */
      if (error.userMessage) {
        fail(error.userMessage)
      } else if (typeof error === 'string') {
        fail(error)
      } else {
        fail('internal error')
      }
    } else {
      end()
    }
  })
}
