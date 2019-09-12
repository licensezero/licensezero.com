var footer = require('./partials/footer')
var head = require('./partials/head')
var html = require('./html')
var nav = require('./partials/nav')

module.exports = /* istanbul ignore next */ function (request, response, error) {
  if (error) request.log.error(error)
  response.statusCode = 500
  response.setHeader('Content-Type', 'text/html')
  response.end(html`
<!doctype html>
<html lang=en>
${head('Error')}
<body>
  ${nav()}
  <main>
    <img class=machine src=https://static.licensezero.com/out-of-order.svg alt="Out of Order">
    <h1>Server Error</h2>
    <p>The website ran into an unexpected technical error.</p>
    <p>This is definitely <em>not</em> your fault.</p>
    <p>
      Please feel free to
      <a href=mailto:support@artlessdevices.com>contact support</a>
      if you need help, or think you might know what&rsquo;s gone wrong.
    </p>
  </main>
  ${footer()}
</body>
</html>
  `)
}
