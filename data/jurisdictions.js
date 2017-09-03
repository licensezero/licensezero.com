var data = require('iso-3166-2').data

var EMBARGOES = [
  'CU', // Cuba
  'IR', // Iran
  'KP', // North Korea
  'LB', // Lebanon
  'LY', // Libya
  'SD', // Sudan
  'SO', // Somalia
  'SY' // Syria
]

module.exports = Object.keys(data)
  .reduce(function (codes, country) {
    if (EMBARGOES.includes(country)) return codes
    return codes.concat(
      Object.keys(data[country].sub)
        .reduce(function (codes, subdivision) {
          return codes.concat(subdivision)
        }, [])
    )
  }, [])
