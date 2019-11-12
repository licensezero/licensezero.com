module.exports = function (buffer) {
  return buffer
    .toString()
    .split('\n')
    .slice(0, -1)
    .map(function (line) {
      var parsed = JSON.parse(line)
      return {
        offerID: parsed[0],
        offered: parsed[1],
        retracted: parsed[2]
      }
    })
}
