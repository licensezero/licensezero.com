module.exports = function (service, total) {
  return Math.floor((total / 100) * service.fee)
}
