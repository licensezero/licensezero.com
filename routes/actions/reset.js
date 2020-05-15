var email = require('../../email')
var fs = require('fs')
var last = require('../../util/last')
var path = require('path')
var randomNonce = require('../../data/random-nonce')
var readDeveloper = require('../../data/read-developer')
var resetTokenPath = require('../../paths/reset-token')
var runSeries = require('run-series')
var runWaterfall = require('run-waterfall')

exports.properties = {
  developerID: require('./common/developer-id'),
  email: require('./common/email')
}

exports.handler = function (log, body, end, fail, lock) {
  var developerID = body.developerID
  runWaterfall([
    readDeveloper.bind(null, developerID),
    function (developer, done) {
      if (last(developer.email) !== body.email) {
        return done('invalid body')
      }
      var token = randomNonce()
      runSeries([
        function writeTokenFile (done) {
          var file = resetTokenPath(token)
          var content = {
            developerID,
            date: new Date().toISOString()
          }
          runSeries([
            fs.mkdir.bind(fs, path.dirname(file), { recursive: true }),
            fs.writeFile.bind(fs, file, JSON.stringify(content))
          ], done)
        },
        function emailLink (done) {
          email(log, {
            to: last(developer.email),
            subject: 'License Zero Token Reset Link',
            text: [
              'licensezero.com received a request to reset',
              'the access token for this developer ID:',
              developer.developerID,
              '',
              'If you need to reset your access token,',
              'use the link below.  If you did not request',
              'a token reset, delete this message.',
              '',
              '<https://licensezero.com/reset/' + token + '>'
            ].join('\n')
          }, done)
        }
      ], done)
    }
  ], function (error) {
    /* istanbul ignore if */
    if (error) {
      log.error(error)
      /* istanbul ignore else */
      if (error.userMessage) return fail(error.userMessage)
      if (typeof error === 'string') return fail(error)
      return fail('internal error')
    }
    end()
  })
}
