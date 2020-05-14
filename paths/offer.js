var path = require('path')

module.exports = function (offer) {
  return path.join(process.env.DIRECTORY, 'offers', offer, 'offer.json')
}
