var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var nav = require('./partials/nav')

module.exports = function (service, response, error) {
  service.log.error(error)
  response.statusCode = 404
  response.setHeader('Content-Type', 'text/html; charset=UTf-8')
  response.end(html`
<!doctype html>
<html>
${head('Not Found')}
<body>
  ${nav()}
  ${header()}
  <main>
    <p class=centered>
      The page you&rsquo;re looking for could not be found.
    </p>
  </main>
  ${footer()}
</body>
</html>
  `)
}
