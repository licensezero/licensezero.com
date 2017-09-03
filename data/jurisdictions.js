var data = require('iso-3166-2').data

module.exports = Object.keys(data)
  .reduce(function (codes, country) {
    return codes.concat(
      Object.keys(data[country].sub)
        .reduce(function (codes, subdivision) {
          return codes.concat(subdivision)
        }, [])
    )
  }, [])
