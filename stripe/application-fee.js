module.exports = function (offer) {
  if (offer.commission === 0) return 0
  return Math.floor((offer.price / 100) * offer.commission)
}
