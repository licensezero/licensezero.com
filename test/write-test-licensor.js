var LICENSOR = require('./licensor')
var argon2 = require('argon2')
var fs = require('fs')
var licensorPath = require('../paths/licensor')
var path = require('path')
var runSeries = require('run-series')

module.exports = function (callback) {
  var file = licensorPath(LICENSOR.id)
  runSeries([
    fs.mkdir.bind(fs, path.dirname(file), { recursive: true }),
    function (done) {
      argon2.hash(LICENSOR.token)
        .catch(done)
        .then(function (hashed) {
          fs.writeFile(file, JSON.stringify({
            licensorID: LICENSOR.id,
            name: [LICENSOR.name],
            email: [LICENSOR.email],
            jurisdiction: [LICENSOR.jurisdiction],
            registered: new Date().toISOString(),
            token: hashed,
            stripe: {
              id: LICENSOR.stripe.id,
              refresh: LICENSOR.stripe.refresh
            }
          }), done)
        })
    }
  ], callback)
}
