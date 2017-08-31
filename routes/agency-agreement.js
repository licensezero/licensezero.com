var commonformToHTML = require('commonform-html')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var terms = require('../forms/agency-agreement')

// TODO: agency agreement

module.exports = function (request, response, service) {
  terms(function (error, terms) {
    if (error) {
      service.log.error(error)
      response.statusCode = 500
      return response.end()
    }
    response.setHeader('Content-Type', 'text/html')
    response.end(html`
<!doctype html>
<html lang=en>
${head()}
<body>
  ${header()}
  <main>
      <h2>Agency Agreement</h2>
      <article class=commonform>
        ${
          commonformToHTML(
            terms.commonform,
            terms.directions,
            {
              title: 'License Zero Agency Agreement',
              html5: true,
              lists: true
            }
          )
        }
      </article>
  </main>
  ${footer()}
</body>
</html>
    `.trim())
  })
}
