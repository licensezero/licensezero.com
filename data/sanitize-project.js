var sanitizeLicensor = require('./sanitize-licensor')

module.exports = function (project) {
  if (project.licensor) {
    sanitizeLicensor(project.licensor)
  }
}
