var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var nav = require('./partials/nav')

module.exports = /* istanbul ignore next */ function (response, error) {
  response.statusCode = 500
  response.setHeader('Content-Type', 'text/html')
  response.end(html`
<!doctype html>
<html lang=en>
${head('Error')}
<body>
  ${nav()}
  ${header()}
  <main>
    <img src=/out-of-order.svg alt="Out of Order">
    <h1>Server Error</h2>
    <p>
      The website ran into an unexpected technical error.
    </p>
  </main>
  ${footer()}
</body>
</html>
  `)
}
