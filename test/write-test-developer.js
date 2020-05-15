var DEVELOPER = require('./developer')
var argon2 = require('argon2')
var fs = require('fs')
var developerPath = require('../paths/developer')
var path = require('path')
var runSeries = require('run-series')

module.exports = function (callback) {
  var file = developerPath(DEVELOPER.id)
  runSeries([
    fs.mkdir.bind(fs, path.dirname(file), { recursive: true }),
    function (done) {
      argon2.hash(DEVELOPER.token)
        .catch(done)
        .then(function (hashed) {
          fs.writeFile(file, JSON.stringify({
            developerID: DEVELOPER.id,
            name: [DEVELOPER.name],
            email: [DEVELOPER.email],
            jurisdiction: [DEVELOPER.jurisdiction],
            registered: new Date().toISOString(),
            token: hashed,
            stripe: {
              id: DEVELOPER.stripe.id,
              refresh: DEVELOPER.stripe.refresh
            }
          }), done)
        })
    }
  ], callback)
}
