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
    <header>
      <img src=/logo-100.png alt="License Zero">
      <h1>License Zero</h1>
      <p>sustainable software in the open</p>
    </header>
    <main>
    </main>
    <footer>
      a service of
      <a href=https://artlessdevices.com target=_blank>
        Artless Devices LLC
      </a>
    </footer>
  </body>
</html>
  `)
}
