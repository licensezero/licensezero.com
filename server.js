var http = require('http')
var makeHandler = require('./')
var pino = require('pino')
var schedule = require('node-schedule')
var sweepOrders = require('./jobs/delete-expired-orders')
var sweepPurchases = require('./jobs/delete-expired-purchases')
var sweepResetTokens = require('./jobs/delete-expired-reset-tokens')

var DIRECTORY = require('./paths/directory')
var PORT = process.env.PORT || 8080

var NAME = require('./package.json').name
var VERSION = require('./package.json').version
var log = pino({name: NAME + '@' + VERSION})

log.info({event: 'data', directory: DIRECTORY})

var requestHandler = makeHandler(log)
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
  job(log, function () { })
  schedule.scheduleJob('0 * * * *', function () {
    job(log, function () { /* pass */ })
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
