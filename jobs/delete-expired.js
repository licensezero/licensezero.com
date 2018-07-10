var expired = require('../data/expired')
var fs = require('fs')
var path = require('path')
var readJSONFile = require('../data/read-json-file')
var runParallelLimit = require('run-parallel-limit')

var LIMIT = 3

module.exports = function (pathFunction) {
  return function (serverLog, callback) {
    var directory = pathFunction()
    var log = serverLog.child({
      subsystem: 'sweep',
      directory: directory
    })
    // List order files.
    fs.readdir(directory, function (error, entries) {
      if (error) {
        log.error(error)
        return callback(error)
      }
      // Process LIMIT at a time.
      runParallelLimit(entries.map(function (entry) {
        return function (done) {
          // Read file content.
          var file = path.join(directory, entry)
          readJSONFile(file, function (error, order) {
            if (error) {
              log.error(error)
              return done()
            }
            if (!expired(order.date)) return done()
            var dataToLog = {order: order.orderID, file: file}
            log.info(dataToLog, 'expired')
            fs.unlink(file, function (error) {
              if (error) log.error(error)
              else log.info(dataToLog, 'deleted')
              done()
            })
          })
        }
      }), LIMIT, function (error) {
        log.info('done')
        callback(error)
      })
    })
  }
}
