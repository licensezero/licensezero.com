var FormData = require('form-data')
var https = require('https')
var simpleConcat = require('simple-concat')

module.exports = function email (service, serverLog) {
  if (process.env.NODE_ENV === 'test') {
    var EventEmitter = require('events').EventEmitter
    var events = new EventEmitter()
    var returned = function (message, callback) {
      events.emit('message', message)
      callback()
    }
    returned.events = events
    return returned
  } else {
    var log = serverLog.child({log: 'email'})
    return function (message, callback) {
      var form = new FormData()
      form.append('from', 'notifications@licensezero.com')
      form.append('to', message.to)
      form.append('subject', message.subject)
      form.append('text', message.text.join('\n\n'))
      var options = {
        method: 'POST',
        host: 'api.mailgun.net',
        path: '/v3/licensezero.com/messages',
        auth: 'api:' + service.MAILGUN_KEY,
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
              log.info({event: 'sent'})
              callback()
            } else {
              simpleConcat(response, function (error, body) {
                if (error) {
                  log.error(error)
                } else {
                  log.error({
                    status: status,
                    body: body.toString()
                  })
                }
              })
            }
          })
      )
    }
  }
}
