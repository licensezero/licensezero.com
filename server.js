var http = require('http')
var makeHandler = require('./')
var pino = require('pino')
var schedule = require('node-schedule')
var sweepOrders = require('./jobs/delete-expired-orders')
var sweepPurchases = require('./jobs/delete-expired-purchases')
var sweepResetTokens = require('./jobs/delete-expired-reset-tokens')

// Create a Pino logger instance.
var log = pino({name: process.env.NAME + '@' + process.env.VERSION})

log.info({event: 'data', directory: process.env.DIRECTORY})

// Create the HTTP server.
var requestHandler = makeHandler(log)
var server = http.createServer(requestHandler)

// Trap signals.
process
  .on('SIGTERM', logSignalAndShutDown)
  .on('SIGQUIT', logSignalAndShutDown)
  .on('SIGINT', logSignalAndShutDown)
  .on('uncaughtException', function handleUncaught (exception) {
    log.error(exception)
    shutDown()
  })

// Start the HTTP server.
server.listen(process.env.PORT, function onListening () {
  var boundPort = this.address().port
  log.info({event: 'listening', port: boundPort})
})

// Run a number of jobs in the background, cron-style.
var jobs = [sweepOrders, sweepResetTokens, sweepPurchases]
jobs.forEach(function (job) {
  job(log, function () { })
  schedule.scheduleJob('0 * * * *', function () {
    job(log, function () { /* pass */ })
  })
})

// Helper Functions

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
