var assert = require('assert')
var fs = require('fs')
var mkdirp = require('mkdirp')
var orderPath = require('../paths/order')
var path = require('path')
var runSeries = require('run-series')
var uuid = require('uuid/v4')

module.exports = function (service, data, callback) {
  assert.equal(typeof data.sponsor, 'string')
  assert.equal(typeof data.jurisdiction, 'string')
  assert.equal(typeof data.projectID, 'string')
  assert(Number.isInteger(data.price))
  assert(data.price > 300)
  var orderID = uuid()
  var file = orderPath(service, orderID)
  runSeries([
    mkdirp.bind(null, path.dirname(file)),
    fs.writeFile.bind(fs, file, JSON.stringify({
      type: 'relicense',
      orderID: orderID,
      projectID: data.projectID,
      sponsor: data.sponsor,
      jurisdiction: data.jurisdiction
    }))
  ], function (error) {
    if (error) return callback(error)
    callback(null, orderID)
  })
}
