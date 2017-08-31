var html = require('./html')

module.exports = /* istanbul ignore next */ function (response, error) {
  response.statusCode = 500
  response.setHeader('Content-Type', 'text/html')
  response.end(html`
<!doctype html>
<html lang=en>
<head>
  <meta charset=UTF-8>
  <title>License Zero | Error<title>
  <link rel=stylesheet href=/normalize.css>
  <link rel=stylesheet href=/styles.css>
</head>
<body>
  <h1>Server Error</h2>
  <p>
    The website ran into an unexpected technical error.
  </p>
</body>
</html>
  `)
}
