var ONE_DAY = 24 * 60 * 60 * 1000

module.exports = function expired (created) {
  return (new Date() - new Date(created)) > ONE_DAY
}
