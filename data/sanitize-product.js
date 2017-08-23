var sanitizeLicensor = require('./sanitize-licensor')

module.exports = function (product) {
  delete product.stripe
  if (product.licensor) {
    sanitizeLicensor(product.licensor)
  }
}
