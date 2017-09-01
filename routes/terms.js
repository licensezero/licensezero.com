var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var nav = require('./partials/nav')

module.exports = function (request, response, service) {
  response.setHeader('Content-Type', 'text/html; charset=UTf-8')
  response.end(html`
<!doctype html>
<html lang=EN>
  ${head('Terms')}
  <body>
    ${nav()}
    ${header()}
    <main>
      <p>
        All users of License Zero must agree to
        <a href=/terms/service>terms of service</a>.
      </p>
      <p>
        To offer private licenses through License Zero,
        licensors must agree to
        <a href=/terms/agency>agency terms</a>.
      </p>
    </main>
    ${footer()}
  </body>
</html>
  `)
}
