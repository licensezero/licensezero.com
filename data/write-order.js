var assert = require('assert')
var fs = require('fs')
var mkdirp = require('mkdirp')
var orderPath = require('../paths/order')
var path = require('path')
var runSeries = require('run-series')
var uuid = require('uuid/v4')

module.exports = function (data, callback) {
  assert.equal(typeof data, 'object')
  assert(Array.isArray(data.projects))
  assert.equal(typeof data.licensee, 'string')
  assert.equal(typeof data.jurisdiction, 'string')
  assert.equal(typeof data.email, 'string')
  assert.equal(typeof callback, 'function')
  var orderID = uuid()
  var file = orderPath(orderID)
  var total = data.projects.reduce(function (total, project) {
    return total + project.price
  }, 0)
  runSeries([
    mkdirp.bind(null, path.dirname(file)),
    fs.writeFile.bind(fs, file, JSON.stringify({
      type: 'licenses',
      orderID: orderID,
      email: data.email,
      jurisdiction: data.jurisdiction,
      licensee: data.licensee,
      projects: data.projects,
      total: total
    }))
  ], function (error) {
    if (error) return callback(error)
    callback(null, orderID)
  })
}
