var http = require('http')
var makeHandler = require('./')
var pino = require('pino')
var schedule = require('node-schedule')
var sweepOrders = require('./jobs/delete-expired-orders')
var sweepPurchases = require('./jobs/delete-expired-purchases')
var sweepResetTokens = require('./jobs/delete-expired-reset-tokens')

// Create a Pino logger instance.
var log = pino({name: 'licensezero.com'})

log.info({event: 'data', directory: process.env.DIRECTORY})

// Check required environment variables.
var requiredEnvironmentVariables = [
  'NODE_ENV',
  'MAILGUN_KEY',
  'MAILGUN_DOMAIN',
  'MAILGUN_FROM',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_PRIVATE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_APPLICATION',
  'STRIPE_CLIENT_ID',
  'DIRECTORY',
  'PORT',
  'PUBLIC_KEY',
  'PRIVATE_KEY',
  'COMMISSION'
]
requiredEnvironmentVariables.forEach(function (key) {
  if (!process.env[key]) {
    log.error({key: key}, 'missing environment variable')
    process.exit(1)
  }
})

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
