module.exports = function (list) {
  return list.reduce(function (result, element) {
    return result + JSON.stringify([
      element.offerID,
      element.offered,
      element.retracted
    ]) + '\n'
  }, '')
}
