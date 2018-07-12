var fs = require('fs')
var parseProjects = require('./parse-projects')
var projectsListPath = require('../paths/projects-list')

module.exports = function (id, callback) {
  var file = projectsListPath(id)
  fs.readFile(file, function (error, buffer) {
    if (error) {
      /* istanbul ignore else */
      if (error.code === 'ENOENT') return callback(null, [])
      return callback(error)
    }
    callback(null, parseProjects(buffer))
  })
}
