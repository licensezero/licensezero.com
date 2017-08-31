var FormData = require('form-data')
var https = require('https')
var parseJSON = require('json-parse-errback')
var simpleConcat = require('simple-concat')

var TESTING = process.env.NODE_ENV === 'test'

module.exports = function (service, code, callback) {
  if (TESTING && code === 'TEST_STRIPE_CODE') {
    return callback(null, {
      stripe_user_id: 'FAKE_STRIPE_ID',
      refresh_token: 'FAKE_REFRESH_TOKEN'
    })
  }
  var form = new FormData()
  form.append('grant_type', 'authorization_code')
  form.append('code', code)
  form.append('client_secret', service.stripe.private)
  form.pipe(
    https.request({
      method: 'POST',
      host: 'connect.stripe.com',
      path: '/oauth/token',
      headers: form.getHeaders()
    })
      .once('error', callback)
      .once('response', function (response) {
        simpleConcat(response, function (error, buffer) {
          if (error) return callback(error)
          parseJSON(buffer, callback)
        })
      })
  )
}
