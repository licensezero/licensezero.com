module.exports = function (cents) {
  return (
    '$' +
    (
      cents < 100
        ? '0.' + (
          cents < 10
            ? '0' + cents.toString()
            : cents.toString()
        )
        : cents.toString().replace(/(\d\d)$/, '.$1')
    )
  )
}
