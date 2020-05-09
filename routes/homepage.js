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
      License Zero is a new way to support open software developers.
    </p>
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
    <img class=explainer alt="An explainer graphic with a row for Parity and for Prosperity, with open and locked doors for for-profit user, open source, and closed source" src=/doors.svg>
    <p>
      licensezero.com works like a vending machine. Developers stock
      licensezero.com with licenses for for-profit and closed-source work.
      licensezero.com sells those licenses to users on developers’
      behalf, and sends the proceeds directly to developers’
      <a href=https://www.stripe.com>Stripe</a> accounts.
    </p>
  </main>
  ${footer()}
</body>
</html>
  `)
}
