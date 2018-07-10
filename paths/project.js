var path = require('path')

module.exports = function (project) {
  return path.join(process.env.DIRECTORY, 'projects', project, 'project.json')
}
