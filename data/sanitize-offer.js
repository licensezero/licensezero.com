var sanitizeDeveloper = require('./sanitize-developer')

module.exports = function (offer) {
  if (offer.developer) sanitizeDeveloper(offer.developer)
}
