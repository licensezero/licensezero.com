var FormData = require('form-data')
var assert = require('assert')
var https = require('https')
var renderMarkdown = require('./util/render-markdown')
var simpleConcat = require('simple-concat')

// When testing, export a function that emits events instead
// of sending e-mail.  Test subscribe to the event emitter.
/* istanbul ignore else */
if (process.env.NODE_ENV === 'test') {
  var EventEmitter = require('events').EventEmitter
  var events = new EventEmitter()
  module.exports = function (requestLog, message, callback) {
    assert.strict.equal(typeof message, 'object')
    assert.strict.equal(typeof message.text, 'string')
    events.emit('message', message)
    callback()
  }
  module.exports.events = events
} else {
  module.exports = function (requestLog, message, callback) {
    var log = requestLog.child({ log: 'email' })
    var form = new FormData()
    form.append('from', process.env.MAILGUN_FROM)
    form.append('to', message.to)
    if (message.cc) form.append('cc', message.cc)
    if (message.bcc) form.append('bcc', message.bcc)
    form.append('subject', message.subject)
    form.append('o:dkim', 'yes')
    form.append('text', message.text)
    form.append('html', renderMarkdown(message.text))
    var license = message.license
    if (license) {
      var licenseBuffer = Buffer.from(JSON.stringify(license))
      form.append('attachment', licenseBuffer, {
        filename: license.offerID + '.json',
        contentType: 'application/json',
        knownLength: licenseBuffer.length
      })
    }
    if (message.agreement) {
      var agreementBuffer = Buffer.from(message.agreement)
      form.append('attachment', agreementBuffer, {
        filename: 'agreement.txt',
        contentType: 'text/plain',
        knownLength: agreementBuffer.length
      })
    }
    if (message.terms) {
      var termsBuffer = Buffer.from(message.terms)
      form.append('attachment', termsBuffer, {
        filename: 'terms-of-service.txt',
        contentType: 'text/plain',
        knownLength: termsBuffer.length
      })
    }
    var options = {
      method: 'POST',
      host: 'api.mailgun.net',
      path: '/v3/' + process.env.MAILGUN_DOMAIN + '/messages',
      auth: 'api:' + process.env.MAILGUN_KEY,
      headers: form.getHeaders()
    }
    form.pipe(
      https.request(options)
        .once('error', function (error) {
          log.error(error)
          callback(error)
        })
        .once('response', function (response) {
          var status = response.statusCode
          if (status === 200) {
            log.info({ event: 'sent' })
            return callback()
          }
          simpleConcat(response, function (error, body) {
            if (error) {
              log.error(error)
              return callback(error)
            }
            var message = body.toString()
            log.error({
              status,
              body: message
            })
            return callback(message)
          })
        })
    )
  }
}
