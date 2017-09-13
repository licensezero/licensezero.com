var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var nav = require('./partials/nav')

module.exports = function (service, response, error) {
  service.log.error(error)
  response.setHeader('Content-Type', 'text/html; charset=UTf-8')
  response.end(html`
<!doctype html>
<html>
${nav()}
${head('Not Found')}
<body>
  ${header()}
  <main>
    <img src=/vending-machine.svg alt="Vending Machine">
    <h2>Not Found</h2>
  </main>
  ${footer()}
</body>
</html>
  `)
}
