var sanitizeLicensor = require('./sanitize-licensor')

module.exports = function (product) {
  if (product.licensor) {
    sanitizeLicensor(product.licensor)
  }
}
