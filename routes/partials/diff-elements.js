var escape = require('../escape')
var html = require('../html')

module.exports = function (elements) {
  return elements.map(function (element) {
    if (element.removed) {
      return html`<del>${escape(element.value)}</del>\n`
    } else if (element.added) {
      return html`<ins>${escape(element.value)}</ins>\n`
    } else {
      return html`<span>${escape(element.value)}</span>\n`
    }
  })
}
