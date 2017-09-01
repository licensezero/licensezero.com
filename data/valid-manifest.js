var AJV = require('ajv')

var ajv = new AJV()

module.exports = ajv.compile(require('../routes/actions/common/manifest'))
