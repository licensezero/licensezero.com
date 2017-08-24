module.exports = {
  application: process.env.STRIPE_APPLICATION,
  private: process.env.STRIPE_PRIVATE_KEY,
  public: process.env.STRIPE_PUBLIC_KEY,
  secret: process.env.STRIPE_WEBHOOK_SECRET
}
