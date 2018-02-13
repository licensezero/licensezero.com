var fs = require('fs')
var mkdirp = require('mkdirp')
var orderPath = require('../paths/order')
var path = require('path')
var runSeries = require('run-series')
var uuid = require('uuid/v4')

// TODO refactor to take a data object, like write-relicense-order

module.exports = function (
  service, pricedProjects, licensee, jurisdiction, email, callback
) {
  var orderID = uuid()
  var file = orderPath(service, orderID)
  var total = pricedProjects.reduce(function (total, project) {
    return total + project.price
  }, 0)
  runSeries([
    mkdirp.bind(null, path.dirname(file)),
    fs.writeFile.bind(fs, file, JSON.stringify({
      type: 'licenses',
      orderID: orderID,
      email: email,
      jurisdiction: jurisdiction,
      licensee: licensee,
      projects: pricedProjects,
      total: total
    }))
  ], function (error) {
    if (error) return callback(error)
    callback(null, orderID)
  })
}
