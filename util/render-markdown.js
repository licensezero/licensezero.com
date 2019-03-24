var commonmark = require('commonmark')

module.exports = function (markdown) {
  var reader = new commonmark.Parser()
  var options = { smart: true }
  var writer = new commonmark.HtmlRenderer(options)
  var parsed = reader.parse(markdown)
  return writer.render(parsed)
}
