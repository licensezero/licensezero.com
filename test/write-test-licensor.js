var LICENSOR = require('./licensor')
var argon2 = require('argon2')
var fs = require('fs')
var licensorPath = require('../paths/licensor')
var mkdirp = require('mkdirp')
var path = require('path')
var runSeries = require('run-series')

module.exports = function (service, callback) {
  var file = licensorPath(service, LICENSOR.id)
  runSeries([
    mkdirp.bind(null, path.dirname(file)),
    function (done) {
      argon2.hash(LICENSOR.password)
        .catch(done)
        .then(function (hashed) {
          fs.writeFile(file, JSON.stringify({
            name: LICENSOR.name,
            email: LICENSOR.email,
            jurisdiction: LICENSOR.jurisdiction,
            registered: new Date().toISOString(),
            password: hashed,
            publicKey: LICENSOR.publicKey,
            privateKey: LICENSOR.privateKey,
            stripe: {
              id: LICENSOR.stripe.id,
              refresh: LICENSOR.stripe.refresh
            }
          }), done)
        })
    }
  ], callback)
}
