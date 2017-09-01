var fs = require('fs')
var mkdirp = require('mkdirp')
var orderPath = require('../paths/order')
var path = require('path')
var runSeries = require('run-series')
var uuid = require('uuid/v4')

module.exports = function (
  service, pricedProducts, tier, licensee, jurisdiction, callback
) {
  var orderID = uuid()
  var file = orderPath(service, orderID)
  var total = pricedProducts.reduce(function (total, product) {
    return total + product.price
  }, 0)
  runSeries([
    mkdirp.bind(null, path.dirname(file)),
    fs.writeFile.bind(fs, file, JSON.stringify({
      orderID: orderID,
      tier: tier,
      jurisdiction: jurisdiction,
      licensee: licensee,
      products: pricedProducts,
      total: total
    }))
  ], function (error) {
    if (error) return callback(error)
    callback(null, orderID)
  })
}
