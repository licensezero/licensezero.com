var footer = require('../partials/footer')
var head = require('../partials/head')
var header = require('../partials/header')
var html = require('../html')

module.exports = function (service, response, error) {
  service.log.error(error)
  response.setHeader('Content-Type', 'text/html; charset=UTf-8')
  response.end(html`
<!doctype html>
<html>
  ${head('Not Found')}
  <body>
    ${header()}
    <main>
      <h2>Not Found</h2>
    </main>
    ${footer()}
  </body>
</html>
  `)
}
