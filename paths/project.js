var path = require('path')

module.exports = function (service, project) {
  return path.join(service.directory, 'projects', project, 'project.json')
}
