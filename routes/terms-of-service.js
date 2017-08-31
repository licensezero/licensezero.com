var commonformToHTML = require('commonform-html')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var terms = require('../forms/terms-of-service')

// TODO: terms of service

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
      <h2>Terms of Service</h2>
      <article class=commonform>
        ${
          commonformToHTML(
            terms.commonform,
            terms.directions,
            {
              title: 'License Zero Terms of Use',
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
