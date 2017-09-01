var footer = require('./partials/footer')
var head = require('./partials/head')
var nav = require('./partials/nav')
var header = require('./partials/header')
var html = require('./html')

module.exports = function (request, response, service) {
  response.setHeader('Content-Type', 'text/html; charset=UTf-8')
  response.end(html`
<!doctype html>
<html lang=EN>
${head()}
<body>
  ${nav()}
  ${header()}
  <main>
    <!-- TODO: licensor terminal demo -->
    <!-- TODO: licensee terminal demo -->
  </main>
  ${footer()}
</body>
</html>
  `)
}
