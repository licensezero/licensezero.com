module.exports = function (project) {
  return Math.floor((project.price / 100) * project.commission)
}
