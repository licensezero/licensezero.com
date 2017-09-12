var escape = require('../escape')
var html = require('../html')

module.exports = function (subtitle) {
  return html`
<head>
  <meta charset=UTF-8>
  <meta name=viewport content="width=725">
  <title>License Zero${subtitle && escape(' // ' + subtitle)}</title>
  <link rel=stylesheet href=/normalize.css>
  <link rel=stylesheet href=/styles.css>
  ${subtitle && subtitle.toLowerCase() === 'manifesto' && TWITTER_CARD.join('\n')}
  <meta name="epigram" content="veritas non auctoritas facit aequitatem">
</head>
  `
}

var TWITTER_CARD = [
  '  <meta name="twitter:card" content="summary">',
  '  <meta name="twitter:title" content="License Zero // Manifesto">',
  '  <meta name="twitter:description" content="sustainable software in the open">',
  '  <meta name="twitter:image" content="https://licensezero.com/logo-100.png">',
  '  <meta name="twitter:site" content="@licensezero">'
]
