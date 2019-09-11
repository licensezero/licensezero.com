var webdriverio = require('webdriverio')

// See: https://webdriver.io/docs/runprogrammatically.html

module.exports = function () {
  return webdriverio.remote({
    logLevel: 'error',
    host: 'localhost',
    port: 9515,
    path: '/',
    capabilities: { browserName: 'chrome' }
  })
}
