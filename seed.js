// ─────────────────────────────────────────────────────────────
//  SEED — imports the legacy menu-data.js array into MongoDB
//  Run once after setting up the DB:   npm run seed
//  Safe to re-run: it replaces the restaurant's menu items.
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import Restaurant from './models/Restaurant.js';
import MenuItem from './models/MenuItem.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MONGODB_URI  = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qrmenu';
const DEFAULT_SLUG = (process.env.DEFAULT_RESTAURANT_SLUG || 'urbo').toLowerCase();

/**
 * menu-data.js is a plain browser script (declares `const menuData`,
 * no exports), so we read it as text and evaluate it in a sandbox to
 * pull the array out — no need to modify the frontend file.
 */
function loadLegacyMenu() {
  const src = readFileSync(path.join(__dirname, 'menu-data.js'), 'utf8');
  const sandbox = {};
  // eslint-disable-next-line no-new-func
  new Function('out', `${src}\nout.menuData = typeof menuData !== 'undefined' ? menuData : [];`)(sandbox);
  return sandbox.menuData || [];
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ MongoDB connected');

  // 1) Ensure the default restaurant exists.
  const restaurant = await Restaurant.findOneAndUpdate(
    { slug: DEFAULT_SLUG },
    {
      $setOnInsert: {
        name: 'URBO COFFEE',
        slug: DEFAULT_SLUG,
        address: 'ул. Кулманова, 105а, «SYILYQ», Атырау',
        workingHours: 'Ежедневно 08:00 – 02:00',
        currency: '₸',
        telegram: {
          botToken: process.env.TELEGRAM_BOT_TOKEN || '',
          chatId:   process.env.TELEGRAM_CHAT_ID   || '',
        },
      },
    },
    { upsert: true, new: true }
  );
  console.log(`🏷️  Restaurant: ${restaurant.name} (${restaurant.slug})`);

  // 2) Replace this restaurant's menu with the legacy array.
  const legacy = loadLegacyMenu();
  await MenuItem.deleteMany({ restaurant: restaurant._id });

  const docs = legacy.map((item, idx) => ({
    restaurant:  restaurant._id,
    name:        item.name,
    price:       item.price,
    category:    item.category,
    image:       item.image || '',
    description: item.description || '',
    badge:       item.badge || '',
    available:   true,
    sortOrder:   idx,
  }));
  await MenuItem.insertMany(docs);

  console.log(`🍽️  Imported ${docs.length} menu items.`);
  await mongoose.disconnect();
  console.log('✅ Done.');
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
