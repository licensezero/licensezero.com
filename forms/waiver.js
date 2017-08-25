var VERSION = '1.0.0'

module.exports = function (options) {
  return `
License Zero Private Waiver ${VERSION}

Beneficiary:  ${options.beneficiary}

Licensor:     ${options.name}
              ${options.jurisdiction} (ISO 3166-2)

Product:      ${options.product}
              ${options.description}
              ${options.repository}

Date:         ${options.date} (ISO 8601)

Term:         ${
  options.term === 'forever'
    ? 'Forever'
    : options.term + ' calendar days'
}

Agent:        Artless Devices LLC
              US-CA (ISO 3166-2)
              https://licensezero.com

The Licensor hereby irrevocably waives the third numbered clause of
the License Zero Public License:

1.  as applied to the product licensed by the Agent under the
    Product Code

2.  for the Beneficiary, as well as Beneficary employees and
    natural-person contractors providing Beneficiary services

3.  for the Term

Licensor expects Beneficiary, its employees, and contractors to rely
on this waiver in redistributing and using the Project without an
additional license from Licensor.
  `.trim()
}

module.exports.version = VERSION
