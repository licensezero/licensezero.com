module.exports = function (project) {
  if (project.commission === 0) return 0
  return Math.floor((project.price / 100) * project.commission)
}
