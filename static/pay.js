/* global STRIPE_PUBLIC_KEY */
document.addEventListener('DOMContentLoaded', function () {
  var form = document.forms[0]
  var stripe = window.Stripe(STRIPE_PUBLIC_KEY)
  var elements = stripe.elements()
  var card = elements.create('card')
  card.mount('#card')
  form.addEventListener('submit', function (event) {
    event.preventDefault()
    var button = document.getElementById('submitButton')
    button.setAttribute('disabled', true)
    button.value = 'Buying...'
    stripe.createToken(card)
      .then(function (result) {
        if (result.error) {
          var errorElement = document.getElementById('card-errors')
          errorElement.textContent = result.error.message
          button.value = 'Buy'
          button.setAttribute('disabled', false)
        } else {
          var input = document.createElement('input')
          input.setAttribute('type', 'hidden')
          input.setAttribute('name', 'token')
          input.setAttribute('value', result.token.id)
          form.appendChild(input)
          form.submit()
        }
      })
  })
})
