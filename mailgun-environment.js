var env = process.env
module.exports = {
  key: env.MAILGUN_KEY,
  domain: env.MAILGUN_DOMAIN || 'licensezero.com',
  from: env.MAILGUN_FROM || 'notifications@' + env.MAILGUN_DOMAIN
}
