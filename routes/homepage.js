var footer = require('../partials/footer')
var header = require('../partials/header')
var html = require('../html')

module.exports = function (request, response, service) {
  response.setHeader('Content-Type', 'text/html; charset=UTf-8')
  response.end(html`
<!doctype html>
<html lang=EN>
  <head>
    <meta charset=UTF-8>
    <title>License Zero</title>
    <link rel=stylesheet href=/normalize.css>
    <link rel=stylesheet href=/styles.css>
  </head>
  <body>
    ${header()}
    <main>
    </main>
    ${footer()}
  </body>
</html>
  `)
}
