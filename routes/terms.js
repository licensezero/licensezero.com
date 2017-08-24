var html = require('../html')

// TODO: terms of service

module.exports = function (request, response, service) {
  response.setHeader('Content-Type', 'text/html')
  response.end(html`
<!doctype html>
<html lang=en>
<head>
  <meta charset=UTF-8>
  <title>License Zero | Terms</title>
  <link rel=stylesheet href=/styles.css>
</head>
<body>
  <h1>License Zero | Terms</h1>
</body>
</html>
  `)
}
