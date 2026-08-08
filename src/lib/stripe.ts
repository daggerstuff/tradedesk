import Stripe from 'stripe';

export const PLANS = {
  invoice_reminders: {
    name: 'Invoice Reminders',
    priceId: process.env.STRIPE_PRICE_INVOICE_REMINDERS || '',
    amount: 1900,
  },
  compliance: {
    name: 'Compliance Tracking',
    priceId: process.env.STRIPE_PRICE_COMPLIANCE || '',
    amount: 4900,
  },
  field_service: {
    name: 'Field Service',
    priceId: process.env.STRIPE_PRICE_FIELD_SERVICE || '',
    amount: 1500,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

export default stripe;

export async function createStripeCustomer(email: string, name?: string): Promise<Stripe.Customer> {
  return stripe.customers.create({ email, name });
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}

export async function createBillingPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function createInvoiceCheckoutSession(
  invoiceId: string,
  amount: number,
  customerEmail: string,
  customerName: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: customerEmail,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `Invoice Payment` },
        unit_amount: Math.round(amount * 100),
      },
      quantity: 1,
    }],
    metadata: { invoiceId, type: 'invoice_payment' },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}

export function constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy'
  );
}
