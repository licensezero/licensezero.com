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
${head(false, {
    title: 'License Zero',
    description: 'gainful open software development'
  })}
<body>
  ${nav()}
  ${header()}
  <main>
    <p class=lead>
      License Zero is a toolkit for supporting open software developers.
    </p>
    <table class=features>
      <thead>
        <tr>
          <td rowspan=2></td>
          <td><a class=licenseLogo target=_blank href=https://paritylicense.com><img alt="Parity License Logo" src=https://paritylicense.com/logo.svg></a></td>
          <td><a class=licenseLogo target=_blank href=https://prosperitylicense.com><img alt="Prosperity License Logo" src=https://prosperitylicense.com/logo.svg></a></td>
          <td><a class=licenseLogo target=_blank href=/licenses/private><img alt="Private License Logo" src=/private-license-logo.svg></a></td>
        </tr>
        <tr>
          <th><a target=_blank href=https://paritylicense.com>Parity<br>License</a></th>
          <th><a target=_blank href=https://prosperitylicense.com>Prosperity<br>License</a></th>
          <th><a target=_blank href=/licenses/private>Private<br>License</a></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>Open Projects</th>
          <td>&#x2714;</td>
          <td>&#x2714;</td>
          <td>&#x2714;</td>
          <th>Open Projects</th>
        </tr>
        <tr>
          <th>Closed Projects</th>
          <td></td>
          <td>&#x2714;</td>
          <td>&#x2714;</td>
          <th>Closed Projects</th>
        </tr>
        <tr>
          <th>Commercial</th>
          <td>&#x2714;</td>
          <td></td>
          <td>&#x2714;</td>
          <th>Commercial</th>
        </tr>
        <tr>
          <th>Noncommercial</th>
          <td>&#x2714;</td>
          <td>&#x2714;</td>
          <td>&#x2714;</td>
          <th>Noncommercial</th>
        </tr>
      </tbody>
    </table>
    <p>
      Contributors can choose from two new licenses,
      <a href=/licenses/parity>Parity</a> and
      <a href=/licenses/prosperity>Prosperity</a>,
      that make their work
      free for not-for-profit or open-source users, then sell private
      licenses to other devs who want to use for profit or in
      closed source.  Everything happens through a simple, dev-friendly
      interface.
    </p>
    <p>
      licensezero.com works like a vending machine. Developers stock
      licensezero.com with licenses for for-profit and closed-source work.
      licensezero.com sells those licenses to users on developers’
      behalf, and sends the proceeds directly to developers’
      <a href=https://www.stripe.com>Stripe</a> accounts.
    </p>
    <p>
      See <a href=https://guide.licensezero.com>the complete developer guide</a>
      for details, next steps, and tips.
    </p>
  </main>
  ${footer()}
</body>
</html>
  `)
}
