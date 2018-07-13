var AJV = require('ajv')

module.exports = new AJV().compile(require('../routes/actions/common/manifest'))
