export const subscriptionPlans = {
  test: {
    id: 'test',
    name: 'Test Plan',
    credits: 10,
    price: 100, // in paise (Rs. 1)
    features: [
      'Test Feature',
      'Basic Access',
    ],
    interval: 'monthly',
  },
  ninja: {
    id: 'ninja',
    name: 'Ninja',
    credits: 150,
    price: 160000, // in paise (Rs. 1600)
    features: [
      'High Quality',
      'AI Texturing',
    ],
    interval: 'monthly',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    credits: 500,
    price: 500000, // in paise (Rs. 5000)
    features: [
      'High Quality',
      'AI Texturing',
      'Remesh',
      'Custom Assets',
    ],
    interval: 'monthly',
  },
  promax: {
    id: 'promax',
    name: 'Pro Max',
    credits: 7000,
    price: 1000000, // in paise (Rs. 10000)
    features: [
      'High Quality',
      'AI Texturing',
      'Remesh',
      'Custom Assets',
      'Rigging Animation',
    ],
    interval: 'monthly',
  },
};

export const topupPlans = {
  test: {
    id: 'test',
    credits: 5,
    price: 100, // in paise (Rs. 1)
  },
  basic: {
    id: 'basic',
    credits: 100,
    price: 40000, // in paise (Rs. 400)
  },
  standard: {
    id: 'standard',
    credits: 400,
    price: 100000, // in paise (Rs. 1000)
  },
  premium: {
    id: 'premium',
    credits: 1000,
    price: 200000, // in paise (Rs. 2000)
  },
};

export const CREDIT_COST_PER_GENERATION = 5; 