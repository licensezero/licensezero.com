var THANKS = require('./thanks.json')

var escape = require('./escape')
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
${head('Thanks', {
  title: 'Thanks',
  description: 'folks who’ve helped License Zero along the way'
})}
<body>
  ${nav()}
  ${header()}
  <main>
    <h2>Thanks</h2>
    <p>Special thanks to&hellip;</p>
    <ul class=thanks>
    ${THANKS.map(function (element) {
      if (element.href) {
        return html`
          <li>
            <a href="${escape(element.href)}"
              >${escape(element.to)}</a>,
            for ${escape(element.for)}.
          </li>
        `
      } else {
        return html`
          <li>
            ${escape(element.to)},
            for ${escape(element.for)}.
          </li>
        `
      }
    })}
    </ul>
    <p>
      These folks don&rsquo;t necessarily endorse License Zero.
      License Zero endorses <em>them</em>.
    </p>
  </main>
  ${footer()}
</body>
</html>
  `)
}
