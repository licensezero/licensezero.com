var html = require('../html')

module.exports = function () {
  return html`
<nav role=navigation>
  <ul>
    <li><a href=/manifesto>Manifesto</a></li>
    <li><a href=/terms>Terms</a></li>
    <li><a href=/forms>Forms</a></li>
    <li><a href=/privacy>Privacy</a></li>
  </ul>
</nav>
  `
}
