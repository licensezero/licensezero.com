module.exports = function (options) {
  return `
License Zero Private Waiver

Beneficiary:  ${options.beneficiary}

Licensor:     ${options.name}
              ${options.jurisdiction} (ISO 3166-2)
              ${options.id}

Product Code: ${options.product}
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

The Licensor hereby irrevocably waives the third numbered
clause of the License Zero Public License applied to the
project with the Product Code:

1.  for the Beneficiary listed above, as well as any
    Beneficiary personnel: Beneficary employees and
    individuals under contract with Beneficiary to provide
    Beneficiary services

2.  for the Term listed above

Licensor expects Beneficiary and its personnnel to rely
on this waiver in redistributing and using the Project
without an additional license from Licensor.
  `.trim()
}
