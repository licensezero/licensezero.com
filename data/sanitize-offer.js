var sanitizeLicensor = require('./sanitize-licensor')

module.exports = function (offer) {
  if (offer.licensor) sanitizeLicensor(offer.licensor)
}
