import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID!
export const TRIAL_PERIOD_DAYS = parseInt(process.env.TRIAL_PERIOD_DAYS || '180', 10)
