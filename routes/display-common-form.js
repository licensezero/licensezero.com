var commonformToHTML = require('commonform-html')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var linkifyURLs = require('linkify-urls')
var nav = require('./partials/nav')

module.exports = function (form, title, overrides) {
  overrides = overrides || {}
  return function (request, response) {
    form(overrides, function (error, terms) {
      if (error) {
        request.log.error(error)
        response.statusCode = 500
        return response.end()
      }
      response.setHeader('Content-Type', 'text/html')
      response.end(html`
<!doctype html>
<html lang=en>
${head()}
<body>
  ${nav()}
  ${header()}
  <main>
      <article class=commonform>
        ${
          linkifyURLs(
            commonformToHTML(
              terms.commonform,
              terms.directions,
              {
                title: 'License Zero ' + title,
                html5: true,
                lists: true
              }
            ),
            {
              type: 'string',
              attributes: {
                target: '_blank'
              }
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
}
