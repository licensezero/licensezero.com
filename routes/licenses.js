var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var nav = require('./partials/nav')

module.exports = function (request, response) {
  response.setHeader('Content-Type', 'text/html; charset=UTf-8')
  response.end(html`
<!doctype html>
<html lang=EN>
${head('Licenses', {
    title: 'License Zero Licenses',
    description: 'public and private licenses for open software'
  })}
<body>
  ${nav()}
  ${header()}
  <main role=main>
    <h1>Licenses</h1>
    <p>
      License Zero publishes and stewards a few kinds of licenses
      and license-related agreements, all of which are written to
      be as short and easy to read as possible.
    </p>
    <h2 id=public-licenses>Public Licenses</h2>
    <p>
      The kind of thing you see in <code>LICENSE</code> files.
      Public licenses give everyone permission to use your software,
      as long as they follow specific conditions.
      License Zero supports two public licenses:
    </p>
    <dl>
      <dt><a href=https://paritylicense.com>Parity Public License</a></dt>
      <dd>
        requires others to release software they build with your work
      </dd>
      <dt><a href=https://prosperitylicense.com>Prosperity Public License</a></dt>
      <dd>
        limits commercial use of your software to a trial period
      </dd>
    </dl>
    <h2 id=private-licenses>Private Licenses</h2>
    <p>
      License Zero's main function is to sell private licenses on
      developers' behalf, as their licensing agent.
    </p>
    <dl>
      <dt><a href=/licenses/private>Private License</a></dt>
      <dd>
        gives a specific person permission to use commercially and
        build closed source, with limited rights to sublicense others
      </dd>
    </dl>
    <h2 id=relicensing>Relicensing</h2>
    <p>
      License Zero developers can offer to relicense their
      work onto permissive open source terms for a one-time fee.
    </p>
    <dl>
      <dt><a href=/licenses/relicense>Relicense Agreement</a></dt>
      <dd>
        a form contract for sponsored relicensing of software
        onto permissive terms
      </dd>
    </dl>
    <h2 id=quotes>Quotes</h2>
    <p>
      Sometimes License Zero developers will find it easier to
      sell exceptions to their public license, or close a
      relicensing deal, by sending the company a quote and taking
      payment by check or bank transfer:
    </p>
    <dl>
      <dt><a href=/licenses/quotes/relicense.odt>Relicense Quote</a></dt>
      <dd>
        quote a price for relicensing your work on
        permissive terms
      </dd>
    </dl>
  </main>
  ${footer()}
</body>
</html>
  `)
}
