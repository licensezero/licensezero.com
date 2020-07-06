var wrapf = require('error').wrapf

module.exports = function (message, error) {
  return wrapf(message, error)
}
