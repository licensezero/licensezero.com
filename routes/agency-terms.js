var displayCommonForm = require('./display-common-form')
var form = require('../forms/agency-terms')

module.exports = displayCommonForm(form, 'Agency Terms', {
  Commission: 'commission'
})
