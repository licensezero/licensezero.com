var html = require('../html')

module.exports = function () {
  return html`
<nav role=navigation>
  <ul>
    <li><a href=/about>About</a></li>
    <li><a href=/terms>Terms</a></li>
    <li><a href=/forms>Forms</a></li>
    <li><a href=/privacy-notice>Privacy</a></li>
  </ul>
</nav>
  `
}
