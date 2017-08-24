var expired = require('../data/expired')
var fs = require('fs')
var ordersPath = require('../paths/orders')
var path = require('path')
var readJSONFile = require('../data/read-json-file')
var runParallelLimit = require('run-parallel-limit')

var LIMIT = 3

module.exports = function (service, callback) {
  var log = service.log.child({subsystem: 'sweep'})
  var directory = ordersPath(service)
  // List order files.
  fs.readdir(directory, function (error, entries) {
    if (error) {
      log.error(error)
      callback(error)
    } else {
      // Process LIMIT at a time.
      runParallelLimit(entries.map(function (entry) {
        return function (done) {
          // Read file content.
          var file = path.join(directory, entry)
          readJSONFile(file, function (error, order) {
            if (error) {
              log.error(error)
              done()
            } else {
              // Check expiration.
              if (expired(order.date)) {
                var dataToLog = {
                  order: order.id,
                  file: file
                }
                log.info(dataToLog, 'expired')
                // Delete expired files.
                fs.unlink(file, function (error) {
                  if (error) {
                    log.error(error)
                  } else {
                    log.info(dataToLog, 'deleted')
                  }
                  done()
                })
              } else {
                done()
              }
            }
          })
        }
      }), LIMIT, callback)
    }
  })
}
