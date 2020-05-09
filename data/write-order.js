var assert = require('assert')
var fs = require('fs')
var orderPath = require('../paths/order')
var path = require('path')
var runSeries = require('run-series')
var uuid = require('uuid/v4')

module.exports = function (data, callback) {
  assert.strict.equal(typeof data, 'object')
  assert(Array.isArray(data.projects))
  assert.strict.equal(typeof data.licensee, 'string')
  assert.strict.equal(typeof data.jurisdiction, 'string')
  assert.strict.equal(typeof data.email, 'string')
  assert.strict.equal(typeof callback, 'function')
  var orderID = uuid()
  var file = orderPath(orderID)
  var total = data.projects.reduce(function (total, project) {
    return total + project.price
  }, 0)
  runSeries([
    fs.mkdir.bind(fs, path.dirname(file), { recursive: true }),
    fs.writeFile.bind(fs, file, JSON.stringify({
      type: 'licenses',
      orderID,
      email: data.email,
      jurisdiction: data.jurisdiction,
      licensee: data.licensee,
      projects: data.projects,
      total
    }))
  ], function (error) {
    if (error) return callback(error)
    callback(null, orderID)
  })
}
