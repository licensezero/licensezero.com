var pino = require('pino')

// Create a Pino logger instance.
var log = pino({ name: 'licensezero.com' })

log.info({ directory: process.env.DIRECTORY }, 'starting')

// Check required environment variables.
var requiredEnvironmentVariables = [
  'NODE_ENV',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_CLIENT_ID',
  'DIRECTORY',
  'PORT',
  'PUBLIC_KEY',
  'PRIVATE_KEY',
  'COMMISSION'
]
if (process.env.NODE_ENV !== 'test') {
  requiredEnvironmentVariables.push(
    'MAILGUN_KEY',
    'MAILGUN_DOMAIN',
    'MAILGUN_FROM'
  )
}
requiredEnvironmentVariables.forEach(function (key) {
  if (!process.env[key]) {
    log.error({ key }, 'missing environment variable')
    process.exit(1)
  }
})
if (process.env.NODE_ENV !== 'test') {
  var prefixes = {
    STRIPE_PUBLISHABLE_KEY: 'pk_live_',
    STRIPE_SECRET_KEY: 'sk_live_',
    STRIPE_CLIENT_ID: 'ca_'
  }
  Object.keys(prefixes).forEach(function (key) {
    var prefix = prefixes[key]
    if (!process.env[key].starsWith(prefix)) {
      log.error('invalid ' + key)
      process.exit(1)
    }
  })
}

// Create the HTTP server.
var requestHandler = require('./')(log)
var server = require('http').createServer(requestHandler)

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
  log.info({ port: boundPort }, 'listening')
})

// Run a number of jobs in the background, cron-style.
var schedule = require('node-schedule')
var jobs = [
  require('./jobs/delete-expired-orders'),
  require('./jobs/delete-expired-purchases'),
  require('./jobs/delete-expired-reset-tokens')
]
jobs.forEach(function (job) {
  job(log, function () { })
  schedule.scheduleJob('0 * * * *', function () {
    job(log, function () { /* pass */ })
  })
})

// Helper Functions

function logSignalAndShutDown () {
  log.info('signal')
  shutDown()
}

function shutDown () {
  server.close(function onClosed () {
    log.info('closed')
    process.exit()
  })
}
