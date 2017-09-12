var commonmark = require('commonmark')
var fs = require('fs')
var html = require('./html')
var internalError = require('./internal-error')
var path = require('path')

var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var nav = require('./partials/nav')

var content

var options = {
  smart: true,
  safe: true
}

module.exports = function (request, response, service) {
  var file = path.join(__dirname, 'questions', 'README.md')
  if (content) {
    withContent()
  } else {
    fs.readFile(file, 'utf8', function (error, markdown) {
      if (error) return internalError(response, error)
      var reader = new commonmark.Parser(options)
      var writer = new commonmark.HtmlRenderer(options)
      var parsed = reader.parse(markdown)
      content = writer.render(parsed)
      withContent()
    })
  }
  function withContent () {
    response.setHeader('Content-Type', 'text/html; charset=UTf-8')
    response.end(html`
<!doctype html>
<html lang=EN>
${head('Questions')}
<body>
  ${nav()}
  ${header()}
  <main>${content}</main>
  ${footer()}
</body>
</html>
    `)
  }
}
