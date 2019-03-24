var escape = require('../escape')
var html = require('../html')

module.exports = function (subtitle, twitterData) {
  return html`
<head>
  <meta charset=UTF-8>
  <meta name=viewport content="width=725">
  <title>License Zero${subtitle && escape(' // ' + subtitle)}</title>
  <link rel=stylesheet href=/normalize.css>
  <link rel=stylesheet href=/styles.css>
  <link rel=author href=/humans.txt>
  ${twitterData && twitterCard(twitterData)}
  ${twitterData && openGraphMetadata(twitterData)}
  <meta name="epigram" content="veritas non auctoritas facit aequitatem">
</head>
  `
}

function twitterCard (data) {
  var returned = ''
  returned += '<meta name="twitter:card" content="summary">'
  returned += '<meta name="twitter:image" content="https://licensezero.com/logo-on-white-100.png">'
  returned += '<meta name="twitter:site" content="@licensezero">'
  if (data.title) {
    returned += `<meta name ="twitter:title" content="${escape(data.title)}">`
  }
  if (data.description) {
    returned += `<meta name ="twitter:description" content="${escape(data.description)}">`
  }
  return returned
}

function openGraphMetadata (data) {
  var returned = ''
  returned += '<meta name="og:type" content="website">'
  returned += '<meta name="og:image" content="https://licensezero.com/logo-on-white-100.png">'
  returned += '<meta name="og:site_name" content="License Zero">'
  if (data.title) {
    returned += `<meta name ="og:title" content="${escape(data.title)}">`
  }
  if (data.description) {
    returned += `<meta name ="og:description" content="${escape(data.description)}">`
  }
  return returned
}
