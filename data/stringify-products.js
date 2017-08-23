module.exports = function (list) {
  return list.reduce(function (result, element) {
    return result + JSON.stringify([
      element.product,
      element.offered,
      element.retracted
    ]) + '\n'
  }, '')
}
