require('dotenv').config({ quiet: true, override: true });

const { initializeDatabase, getPool } = require('../config/database');
const { runMigrations } = require('../config/migrations');
const { hashPassword } = require('../utils/authHelpers');
const { USER_ROLES } = require('../config/collections');
const logger = require('../utils/logger');

const SEED_USERS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Platform Admin',
    email: 'admin@food.local',
    password: 'Password1!Admin',
    role: USER_ROLES.admin,
    address: '100 Admin Street, Food City',
    verified: 1,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Spice Kitchen Owner',
    email: 'owner@food.local',
    password: 'Password1!Owner',
    role: USER_ROLES.restaurantOwner,
    address: '22 Market Road, Food City',
    verified: 1,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Demo Customer',
    email: 'customer@food.local',
    password: 'Password1!Cust',
    role: USER_ROLES.customer,
    address: '7 Park Lane, Food City',
    verified: 1,
  },
];

const SEED_RESTAURANT = {
  id: '44444444-4444-4444-8444-444444444444',
  owner_id: '22222222-2222-4222-8222-222222222222',
  name: 'Spice Kitchen',
  category: 'Indian',
  location: 'Downtown Food City',
  image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
  is_verified: 1,
};

const SEED_MENU_ITEMS = [
  {
    id: '55555555-5555-4555-8555-555555555551',
    restaurant_id: SEED_RESTAURANT.id,
    item_name: 'Butter Chicken',
    price: 320,
    image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82bbed7a0?auto=format&fit=crop&w=900&q=80',
    availability: 1,
  },
  {
    id: '55555555-5555-4555-8555-555555555552',
    restaurant_id: SEED_RESTAURANT.id,
    item_name: 'Paneer Tikka',
    price: 260,
    image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a2be?auto=format&fit=crop&w=900&q=80',
    availability: 1,
  },
  {
    id: '55555555-5555-4555-8555-555555555553',
    restaurant_id: SEED_RESTAURANT.id,
    item_name: 'Garlic Naan',
    price: 60,
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
    availability: 1,
  },
];

const seedUsers = async (pool) => {
  for (const user of SEED_USERS) {
    const passwordHash = await hashPassword(user.password);

    await pool.execute(
      `INSERT INTO users (id, name, email, password, role, address, verified)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         password = VALUES(password),
         role = VALUES(role),
         address = VALUES(address),
         verified = VALUES(verified)`,
      [user.id, user.name, user.email, passwordHash, user.role, user.address, user.verified],
    );
  }
};

const seedRestaurant = async (pool) => {
  await pool.execute(
    `INSERT INTO restaurants (id, owner_id, name, category, location, image_url, is_verified)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       owner_id = VALUES(owner_id),
       name = VALUES(name),
       category = VALUES(category),
       location = VALUES(location),
       image_url = VALUES(image_url),
       is_verified = VALUES(is_verified)`,
    [
      SEED_RESTAURANT.id,
      SEED_RESTAURANT.owner_id,
      SEED_RESTAURANT.name,
      SEED_RESTAURANT.category,
      SEED_RESTAURANT.location,
      SEED_RESTAURANT.image_url,
      SEED_RESTAURANT.is_verified,
    ],
  );
};

const seedMenuItems = async (pool) => {
  for (const item of SEED_MENU_ITEMS) {
    await pool.execute(
      `INSERT INTO menu_items (id, restaurant_id, item_name, price, image_url, availability)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         item_name = VALUES(item_name),
         price = VALUES(price),
         image_url = VALUES(image_url),
         availability = VALUES(availability)`,
      [
        item.id,
        item.restaurant_id,
        item.item_name,
        item.price,
        item.image_url,
        item.availability,
      ],
    );
  }
};

const main = async () => {
  initializeDatabase();
  await runMigrations();

  const pool = getPool();
  await seedUsers(pool);
  await seedRestaurant(pool);
  await seedMenuItems(pool);

  logger.info('Database seeded with demo accounts.');
  console.log('\nDemo accounts (use on Login page):');
  console.log('  Admin:    admin@food.local    / Password1!Admin');
  console.log('  Owner:    owner@food.local    / Password1!Owner');
  console.log('  Customer: customer@food.local / Password1!Cust\n');
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('Seed failed.', { message: error.message });
    process.exit(1);
  });
