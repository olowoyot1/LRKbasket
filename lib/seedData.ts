export const STARTER_PRODUCTS = [
  { name: 'Scotch bonnet peppers', category: 'produce', icon: 'pepper', price: 1200, unit: '500g bag', tag: 'Farm fresh', color: 'purple', stock: 40 },
  { name: 'Vine tomatoes', category: 'produce', icon: 'tomato', price: 1500, unit: '1kg basket', tag: 'Farm fresh', color: 'yellow', stock: 60 },
  { name: 'Ugu leaves', category: 'produce', icon: 'leaf', price: 900, unit: 'bunch', tag: 'Picked today', color: 'purple', stock: 25 },
  { name: 'Fresh okra', category: 'produce', icon: 'leaf', price: 800, unit: '500g', tag: 'Farm fresh', color: 'yellow', stock: 35 },
  { name: 'Ripe plantain', category: 'fruit', icon: 'banana', price: 1300, unit: 'bunch of 5', tag: 'Farm fresh', color: 'yellow', stock: 30 },
  { name: 'Watermelon', category: 'fruit', icon: 'melon', price: 2200, unit: 'whole, ~4kg', tag: 'In season', color: 'purple', stock: 15 },
  { name: 'Pawpaw', category: 'fruit', icon: 'papaya', price: 1000, unit: 'each', tag: 'In season', color: 'yellow', stock: 45 },
  { name: 'Ofada rice', category: 'grains', icon: 'wheat', price: 3200, unit: '2kg bag', tag: 'Stone-milled', color: 'purple', stock: 20 },
  { name: 'Brown beans (oloyin)', category: 'grains', icon: 'bean', price: 2400, unit: '2kg bag', tag: 'Farm sorted', color: 'yellow', stock: 50 },
  { name: 'Unpolished brown rice', category: 'grains', icon: 'wheat', price: 3000, unit: '2kg bag', tag: 'Whole grain', color: 'purple', stock: 22 },
  { name: 'Free-range eggs', category: 'dairy', icon: 'egg', price: 2800, unit: 'crate of 30', tag: 'Farm fresh', color: 'yellow', stock: 12 },
  { name: 'Fresh cow milk', category: 'dairy', icon: 'jug', price: 1600, unit: '1 litre', tag: 'Unhomogenized', color: 'purple', stock: 18 },
  { name: 'Wara (local cheese)', category: 'dairy', icon: 'cheese', price: 1900, unit: '400g', tag: 'Handmade', color: 'yellow', stock: 16 },
  { name: 'Sprouted moringa leaves', category: 'raw', icon: 'sprout', price: 1100, unit: '250g', tag: 'Raw', color: 'purple', stock: 28 },
  { name: 'Raw wild honey', category: 'raw', icon: 'honey', price: 4500, unit: '500ml jar', tag: 'Unfiltered', color: 'yellow', stock: 10 },
  { name: 'Sprouted groundnuts', category: 'raw', icon: 'nut', price: 1700, unit: '400g', tag: 'Raw', color: 'purple', stock: 32 },
  { name: 'Unrefined red palm oil', category: 'pantry', icon: 'jar', price: 2600, unit: '1 litre', tag: 'Cold-pressed', color: 'yellow', stock: 24 },
  { name: 'Ground crayfish', category: 'pantry', icon: 'fish', price: 2100, unit: '300g', tag: 'Sun-dried', color: 'purple', stock: 26 },
  { name: 'Dried ata rodo', category: 'pantry', icon: 'chili', price: 1400, unit: '250g', tag: 'Sun-dried', color: 'yellow', stock: 38 },
];

export const DEFAULT_SETTINGS = { deliveryFee: 1500, freeDeliveryThreshold: 15000 };

// Bundles reference products by name - resolved to real product IDs at seed
// time (see prisma/seed.ts and app/api/admin/seed/route.ts), since products
// must exist first.
export const STARTER_BUNDLES = [
  {
    name: 'Soup Starter Pack',
    description: 'Everything for a pot of soup base — greens, pepper, crayfish, and palm oil.',
    price: 6900,
    tag: 'Bundle',
    color: 'purple',
    active: true,
    groupBuyEnabled: true,
    groupBuyTarget: 8,
    groupBuyDiscountPercent: 10,
    items: [
      { productName: 'Ugu leaves', qty: 1 },
      { productName: 'Fresh okra', qty: 1 },
      { productName: 'Ground crayfish', qty: 1 },
      { productName: 'Dried ata rodo', qty: 1 },
      { productName: 'Unrefined red palm oil', qty: 1 },
    ],
  },
  {
    name: 'Breakfast Basket',
    description: 'Eggs, milk, local cheese, and plantain — a full breakfast spread.',
    price: 6800,
    tag: 'Bundle',
    color: 'yellow',
    active: true,
    groupBuyEnabled: true,
    groupBuyTarget: 6,
    groupBuyDiscountPercent: 8,
    items: [
      { productName: 'Free-range eggs', qty: 1 },
      { productName: 'Fresh cow milk', qty: 1 },
      { productName: 'Wara (local cheese)', qty: 1 },
      { productName: 'Ripe plantain', qty: 1 },
    ],
  },
  {
    name: 'Raw Pantry Starter',
    description: 'Raw honey, sprouted groundnuts, and sprouted moringa — unprocessed staples.',
    price: 6600,
    tag: 'Bundle',
    color: 'purple',
    active: true,
    groupBuyEnabled: true,
    groupBuyTarget: 5,
    groupBuyDiscountPercent: 12,
    items: [
      { productName: 'Raw wild honey', qty: 1 },
      { productName: 'Sprouted groundnuts', qty: 1 },
      { productName: 'Sprouted moringa leaves', qty: 1 },
    ],
  },
];
