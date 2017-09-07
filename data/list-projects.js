var fs = require('fs')
var parseProjects = require('./parse-projects')
var projectsListPath = require('../paths/projects-list')

module.exports = function (service, id, callback) {
  var file = projectsListPath(service, id)
  fs.readFile(file, function (error, buffer) {
    if (error) {
      /* istanbul ignore else */
      if (error.code === 'ENOENT') {
        callback(null, [])
      } else {
        callback(error)
      }
    } else {
      callback(null, parseProjects(buffer))
    }
  })
}
