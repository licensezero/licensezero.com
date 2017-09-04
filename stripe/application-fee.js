module.exports = function (product) {
  return Math.floor((product.price / 100) * product.commission)
}
