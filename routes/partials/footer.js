var html = require('../html')

module.exports = function () {
  return html`
<footer>
  <p>
    a service of
    <a href=https://artlessdevices.com target=_blank>
      Artless Devices LLC
    </a>
  </p>
  <p>
    gettin&rsquo; by with a little help from
    <a href=/thanks>many friends</a>
  </p>
  <p>contact: <a href=mailto:support@artlessdevices.com>support@artlessdevices.com</a></p>
</footer>
  `
}
