var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var nav = require('./partials/nav')

module.exports = function (request, response) {
  response.setHeader('Content-Type', 'text/html; charset=UTF-8')
  response.end(html`
<!doctype html>
<html lang=EN>
${head('Pricing', {
    title: 'License Zero Pricing',
    description: 'costs of selling licenses through License Zero'
  })}
<body>
  ${nav()}
  ${header()}
  <main>
    <h1>Pricing</h1>

    <math>
      <mrow>
        <mi>Customer Paid</mi>
        <mo>&minus;</mo>
        <mi>${process.env.COMMISSION}%</mi>
        <mo>&minus;</mo>
        <mi>30&cent;</mi>
        <mo>&minus;</mo>
        <mi>2.9%</mi>
        <mo>=</mo>
        <mi>Developer Paid</mi>
      </mrow>
    </math>

    <p>
      Developers pay
      <a href=https://artlessdevices.com>Artless Devices</a>,
      the company behind License Zero, commission on each sale.

      Commission is currently ${process.env.COMMISSION}% of
      purchase price for new accounts.

      See the <a href=/terms/agency#commission>commission
      section of the agency terms</a> for specifics.
    </p>

    <p>
      Developers also pay <a href=https://stripe.com>Stripe</a>
      for payment processing.  As of May 2020, Stripe offers
      2.9% plus 30&cent; for new accounts.
    </p>

    <p>
      Depending on the jurisdictions of the buyer and the
      seller, one or both may owe sales taxes. License Zero
      can’t do your taxes for you, but it reports <a
      href=https://en.wikipedia.org/wiki/ISO_3166-2>standard
      jurisdiction codes</a> for buyers and sellers, so
      everyone has the records they need to comply.
    </p>
  </main>
  ${footer()}
</body>
</html>
  `)
}
