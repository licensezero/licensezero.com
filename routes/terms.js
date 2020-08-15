var alert = require('./partials/alert')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var nav = require('./partials/nav')

module.exports = function (request, response) {
  response.setHeader('Content-Type', 'text/html; charset=UTf-8')
  response.end(html`
<!doctype html>
<html lang=EN>
  ${head('Terms', {
    title: 'licensezero.com Terms',
    description: 'terms of use for licensezero.com'
  })}
  <body>
    ${nav()}
    ${alert()}
    ${header()}
    <main role=main>
      <h1>Terms</h1>
      <p>
        All users of License Zero must agree to
        <a href=/terms/service>terms of service</a>.
      </p>
      <p>
        License Zero’s
        <a href=/privacy>privacy policy</a>
        covers licensezero.com.
      </p>
      <p>
        To offer private licenses through License Zero,
        developers must agree to
        <a href=/terms/agency>agency terms</a>.
      </p>
    </main>
    ${footer()}
  </body>
</html>
  `)
}
