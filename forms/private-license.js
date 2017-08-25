/* eslint-disable max-len */
var TIERS = require('../data/private-license-tiers')
var capitalize = require('../routes/capitalize')

module.exports = function (options) {
  var licensor = options.licensor
  var licensee = options.licensee
  return `
Licenze Zero ${capitalize(options.tier)} Private License
Version 1.0.0
https://licensezero.com

${options.date} (ISO 8601)

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean:

          ${licensor.name}
          ${licensor.jurisdiction} (ISO 3166-2)

          acting through its appointed agent:

          Artless Devices, LLC
          US-CA (ISO 3166-2)
          https://licensezero.com

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean:

          ${licensee.name}
          ${licensee.jurisdiction} (ISO 3166-2)

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

   2. Grant of Copyright License. Subject to the terms and conditions of this
      License, the Licensor hereby grants to You a perpetual,
      worldwide, non-exclusive, irrevocable copyright license to
      reproduce, prepare Derivative Works of, publicly display,
      publicly perform, and distribute the Work and such Derivative
      Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, the Licensor hereby grants to You a perpetual,
      worldwide, non-exclusive, irrevocable (except as stated in this section)
      patent license to make, have made, use, offer to sell, sell, import,
      and otherwise transfer the Work. If You institute patent litigation
      against any entity (including a cross-claim or counterclaim in a
      lawsuit) alleging that the Work constitutes direct or contributory
      patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications,
      provided Your use, reproduction, and distribution of the Work
      otherwise complies with the conditions stated in this License.

${sublicensing(options.tier)}

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall the Licensor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if the Licensor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of the Licensor, and only if You agree to indemnify,
      defend, and hold the Licensor harmless for any liability
      incurred by, or claims asserted against, the Licensor by reason
      of your accepting any such warranty or additional liability.
  `.trim()
}

function sublicensing (tier) {
  if (tier === 'solo') {
    return `
   5. Sublicensing. The licenses granted in Section 2 (Grant of Copyright
      License) and Section 3 (Grant of Patent License) permit You to
      sublicense others, to the extent necessary to use, reproduce, and
      distribute Derivative Works and other works of authorship that utilize
      or incorporate the Work that You license, provided those works afford
      significant additional functionality over that of the Work alone.This
      License is conditional upon Your adherence to limits on your permission
      to sublicense.
    `.trim()
  } else if (tier === 'enterprise') {
    return `
   5. Sublicensing. The licenses granted in Section 2 (Grant of Copyright
      License) and Section 3 (Grant of Patent License) permit You to
      sublicense (i) Your employees and natural-person independent contractors
      providing services to You; and (ii) anyone, to the extent necessary to
      use, reproduce, and distribute Derivative Works and other works of
      authorship that utilize or incorporate the Work that You license,
      provided those works afford significant additional functionality over
      that of the Work alone.
    `.trim()
  } else {
    var limit = TIERS[tier].toString()
    return `
   5. Sublicensing. The licenses granted in Section 2 (Grant of Copyright
      License) and Section 3 (Grant of Patent License) permit You to
      sublicense (i) Your employees and natural-person independent contractors
      providing services to You, up to a maximum of ${limit} individuals in any
      single 365-calendar-day period; and (ii) anyone, to the extent necessary
      to use, reproduce, and distribute Derivative Works and other works of
      authorship that utilize or incorporate the Work that You license,
      provided those works afford significant additional functionality over
      that of the Work alone.
    `.trim()
  }
}
