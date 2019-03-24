var html = require('../html')

module.exports = function () {
  return html`
<nav role=navigation>
  <ul>
    <li><a href=/>Use</a></li>
    <li><a href=https://blog.licensezero.com/>Blog</a></li>
    <li><a href=https://guide.licensezero.com>Guide</a></li>
    <li><a href=/commitment>Commitment</a></li>
    <li><a href=/terms>Terms</a></li>
    <li><a href=/licenses>Licenses</a></li>
  </ul>
</nav>
  `
}
