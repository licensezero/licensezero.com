var decode = require('./data/decode')
var sweepOrders = require('./jobs/delete-expired-orders')
var sweepResetTokens = require('./jobs/delete-expired-reset-tokens')
var http = require('http')
var makeHandler = require('./')
var pino = require('pino')
var schedule = require('node-schedule')

var DIRECTORY = process.env.DIRECTORY || 'licensezero'
var PORT = process.env.PORT || 8080
var service = {
  directory: DIRECTORY,
  port: PORT,
  publicKey: decode(process.env.PUBLIC_KEY),
  privateKey: decode(process.env.PRIVATE_KEY),
  stripe: require('./stripe-environment'),
  mailgun: require('./mailgun-environment'),
  fee: 25
}

var NAME = require('./package.json').name
var VERSION = require('./package.json').version
var log = pino({name: NAME + '@' + VERSION})
service.log = log

log.info({event: 'data', directory: DIRECTORY})

var requestHandler = makeHandler(service, log)
var server = http.createServer(requestHandler)

process
  .on('SIGTERM', logSignalAndShutDown)
  .on('SIGQUIT', logSignalAndShutDown)
  .on('SIGINT', logSignalAndShutDown)
  .on('uncaughtException', function handleUncaught (exception) {
    log.error(exception)
    shutDown()
  })

server.listen(PORT, function onListening () {
  var boundPort = this.address().port
  log.info({event: 'listening', port: boundPort})
})

var jobs = [sweepOrders, sweepResetTokens]
jobs.forEach(function (job) {
  job(service, function () { })
  schedule.scheduleJob('0 * * * *', function () {
    job(service, function () { /* pass */ })
  })
})

function logSignalAndShutDown () {
  log.info({event: 'signal'})
  shutDown()
}

function shutDown () {
  server.close(function onClosed () {
    log.info({event: 'closed server'})
    process.exit()
  })
}
