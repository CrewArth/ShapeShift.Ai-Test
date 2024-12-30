import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay with proper error handling
const initRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay API keys are not configured');
  }

  console.log('[RAZORPAY] Initializing with:', {
    keyId: keyId.substring(0, 10) + '...',
    keySecret: keySecret.substring(0, 5) + '...',
    environment: process.env.NODE_ENV
  });

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
};

// Create a function to get or initialize Razorpay
const getRazorpayInstance = () => {
  if (!razorpay) {
    razorpay = initRazorpay();
  }
  return razorpay;
};

let razorpay: Razorpay | null = null;

interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
}

interface RazorpayOrderCreateOptions {
  amount: number;
  currency: string;
  receipt?: string;
  notes?: Record<string, string>;
  payment_capture?: boolean;
}

interface RazorpayCustomer {
  id: string;
  name: string;
  email: string;
  contact?: string;
}

interface RazorpaySubscription {
  id: string;
  plan_id: string;
  customer_id: string;
  total_count: number;
  quantity: number;
  status: string;
}

interface RazorpaySubscriptionCreateOptions {
  plan_id: string;
  total_count: number;
  quantity: number;
  customer_notify?: 0 | 1;
  notes?: Record<string, string>;
}

export async function createOrder(amount: number, planId: string, currency: string = 'INR'): Promise<RazorpayOrder> {
  try {
    const instance = getRazorpayInstance();
    
    console.log('[RAZORPAY] Creating order:', {
      amount,
      currency,
      keyId: process.env.RAZORPAY_KEY_ID?.substring(0, 10) + '...'
    });

    const order = await instance.orders.create({
      amount,
      currency,
      payment_capture: true,
      notes: {
        planId,
        created_at: new Date().toISOString()
      }
    } as RazorpayOrderCreateOptions);

    console.log('[RAZORPAY] Order created successfully:', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });

    return order as RazorpayOrder;
  } catch (error: any) {
    console.error('[RAZORPAY] Error creating order:', {
      error: error.message,
      details: error.error,
      statusCode: error.statusCode,
      stack: error.stack
    });
    throw error;
  }
}

export async function verifyPayment(paymentId: string, orderId: string, signature: string) {
  try {
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    return expectedSignature === signature;
  } catch (error) {
    console.error('[RAZORPAY] Error verifying payment:', error);
    throw error;
  }
}

export async function createCustomer(name: string, email: string): Promise<RazorpayCustomer> {
  try {
    const instance = getRazorpayInstance();
    const customer = await instance.customers.create({
      name,
      email,
      fail_existing: 0
    });
    return customer as RazorpayCustomer;
  } catch (error) {
    console.error('[RAZORPAY] Error creating customer:', error);
    throw error;
  }
}

export async function fetchSubscription(subscriptionId: string): Promise<RazorpaySubscription> {
  try {
    const instance = getRazorpayInstance();
    const subscription = await instance.subscriptions.fetch(subscriptionId);
    return subscription as RazorpaySubscription;
  } catch (error) {
    console.error('[RAZORPAY] Error fetching subscription:', error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<RazorpaySubscription> {
  try {
    const instance = getRazorpayInstance();
    const subscription = await instance.subscriptions.cancel(subscriptionId);
    return subscription as RazorpaySubscription;
  } catch (error) {
    console.error('[RAZORPAY] Error canceling subscription:', error);
    throw error;
  }
}

export async function createSubscription(planId: string, customerId: string): Promise<RazorpaySubscription> {
  try {
    const instance = getRazorpayInstance();
    const subscription = await instance.subscriptions.create({
      plan_id: planId,
      total_count: 12, // 12 months
      quantity: 1,
      customer_notify: 1,
      notes: {
        customer_id: customerId
      }
    } as RazorpaySubscriptionCreateOptions);
    
    return {
      id: subscription.id,
      plan_id: subscription.plan_id,
      customer_id: customerId,
      total_count: subscription.total_count,
      quantity: subscription.quantity ?? 1,
      status: subscription.status
    };
  } catch (error) {
    console.error('[RAZORPAY] Error creating subscription:', error);
    throw error;
  }
}

// Export the getRazorpayInstance function instead of the instance directly
export default getRazorpayInstance; 