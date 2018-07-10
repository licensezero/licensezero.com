var stripe = require('stripe')

module.exports = stripe(process.env.STRIPE_SECRET_KEY)
