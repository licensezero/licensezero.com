var http = require('http')
var makeHandler = require('./')
var pino = require('pino')
var schedule = require('node-schedule')
var sweepOrders = require('./jobs/delete-expired-orders')
var sweepPurchases = require('./jobs/delete-expired-purchases')
var sweepResetTokens = require('./jobs/delete-expired-reset-tokens')

var DIRECTORY = process.env.DIRECTORY || 'licensezero'
var PORT = process.env.PORT || 8080
var service = {
  directory: DIRECTORY,
  port: PORT,
  publicKey: Buffer.from(process.env.PUBLIC_KEY, 'hex'),
  privateKey: Buffer.from(process.env.PRIVATE_KEY, 'hex'),
  stripe: require('./environment/stripe'),
  mailgun: require('./environment/mailgun'),
  fee: 15
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

var jobs = [sweepOrders, sweepResetTokens, sweepPurchases]
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
