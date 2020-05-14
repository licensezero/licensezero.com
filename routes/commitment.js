var footer = require('./partials/footer')
var fs = require('fs')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var nav = require('./partials/nav')
var path = require('path')
var renderMarkdown = require('../util/render-markdown')

module.exports = function (request, response) {
  response.setHeader('Content-Type', 'text/html; charset=UTf-8')
  var markdownFile = path.join(__dirname, 'commitment.md')
  fs.readFile(markdownFile, 'utf8', function (error, markdown) {
    if (error) return internalError(request, response, error)
    response.end(html`
<!doctype html>
<html lang=EN>
${head('Founder Commitment', {
    title: 'Founder Commitment',
    description: 'public commitment about the business of License Zero'
  })}
<body>
  ${nav()}
  ${header()}
  <main role=main>${renderMarkdown(markdown)}</main>
  ${footer()}
</body>
</html>
    `)
  })
}
