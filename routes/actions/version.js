var NAME = require('../../package.json').name
var VERSION = require('../../package.json').version

exports.handler = function (log, body, end, fail) {
  end({
    service: NAME || 'licensezero-server',
    version: VERSION || null
  })
}
