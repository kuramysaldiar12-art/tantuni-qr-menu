// ─────────────────────────────────────────────────────────────
//  QR-MENU SaaS — Backend
//  Node.js + Express + MongoDB (Mongoose)
//  Run:   npm install  &&  npm run seed  &&  npm start
//  Hosts: Railway / Koyeb / Render (set env vars in dashboard)
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

import Restaurant from './models/Restaurant.js';
import MenuItem from './models/MenuItem.js';
import Order from './models/Order.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Configuration (all overridable via environment) ──────────
const PORT          = process.env.PORT || 3000;
const MONGODB_URI   = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qrmenu';
const SESSION_SECRET= process.env.SESSION_SECRET || 'dev-only-secret-change-me';
const ADMIN_USER    = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS    = process.env.ADMIN_PASSWORD || 'changeme123';
const DEFAULT_SLUG  = (process.env.DEFAULT_RESTAURANT_SLUG || 'urbo').toLowerCase();
const IS_PROD       = process.env.NODE_ENV === 'production';

// Native fetch (Node 18+). Falls back to node-fetch if present.
const fetchFn = globalThis.fetch ?? (await import('node-fetch').then(m => m.default).catch(() => null));

const app = express();
app.set('trust proxy', 1); // needed for secure cookies behind Railway/Koyeb proxy

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: 'qrmenu.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGODB_URI, collectionName: 'sessions' }),
    cookie: {
      httpOnly: true,
      secure: IS_PROD,             // HTTPS-only cookie in production
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8,  // 8h session
    },
  })
);

// Don't expose backend source/config as static files. (.env and other
// dotfiles are already ignored by express.static's default settings.)
app.use((req, res, next) => {
  if (/^\/(server\.js|seed\.js|package(-lock)?\.json)$/.test(req.path) || req.path.startsWith('/models')) {
    return res.status(404).end();
  }
  next();
});

// Serve the static frontend (index.html, app.js, menu-data.js, images…)
app.use(express.static(__dirname));

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════

/** Resolve a restaurant by slug, falling back to the default tenant. */
async function resolveRestaurant(slug) {
  if (slug) {
    const bySlug = await Restaurant.findOne({ slug: String(slug).toLowerCase() });
    if (bySlug) return bySlug;
  }
  const byDefault = await Restaurant.findOne({ slug: DEFAULT_SLUG });
  if (byDefault) return byDefault;
  return Restaurant.findOne().sort({ createdAt: 1 }); // very first restaurant
}

/** Timing-safe string comparison (avoids leaking length/timing on login). */
function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// ════════════════════════════════════════════════════════════
//  POS INTEGRATION (placeholder, ready for a real provider)
// ════════════════════════════════════════════════════════════

/**
 * sendOrderToPOS — hands a saved order off to the venue's POS system.
 *
 * For now it simply prints the order to the console and marks the
 * order as `sent_to_pos`. Plug a real provider in where marked below.
 *
 * @param {string} orderId  Mongo _id of a saved Order document.
 */
async function sendOrderToPOS(orderId) {
  const order = await Order.findById(orderId).populate('restaurant', 'name slug');
  if (!order) {
    console.error(`[POS] Order ${orderId} not found`);
    return;
  }

  const payload = {
    orderId:      order._id.toString(),
    restaurant:   order.restaurant?.name,
    type:         order.order_type,
    table_number: order.table_number,
    customer:     order.customer,
    items:        order.items.map(i => ({ name: i.name, qty: i.quantity, price: i.price })),
    total_price:  order.total_price,
    timestamp:    order.timestamp,
  };

  console.log('\n=== [POS] New order ===');
  console.log(JSON.stringify(payload, null, 2));
  console.log('=======================\n');

  // ───────────────────────────────────────────────────────────
  //  TODO: REAL POS INTEGRATION GOES HERE
  // ───────────────────────────────────────────────────────────
  //  Replace the block above with a call to your POS provider's API.
  //  The exact shape depends on the vendor — examples:
  //
  //  • iiko (iikoCloud / iikoTransport):
  //      POST https://api-ru.iiko.services/api/1/deliveries/create
  //      Headers: Authorization: Bearer <access_token>
  //      Body: { organizationId, order: { ...mapped fields... } }
  //
  //  • r_keeper (XML/Cloud API):
  //      POST https://<your-rk7>/rk7api/v0/xmlinterface.xml
  //      Body: <RK7CMD CMD="CreateOrder"> ... </RK7CMD>
  //
  //  • Poster (joinposter.com):
  //      POST https://joinposter.com/api/incomingOrders.createIncomingOrder
  //           ?token=<api_token>
  //      Body: { spot_id, products: [{ product_id, count }], ... }
  //
  //  Typical implementation:
  //    try {
  //      const res = await fetchFn(POS_ENDPOINT, {
  //        method: 'POST',
  //        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${POS_TOKEN}` },
  //        body: JSON.stringify(mapOrderToPosFormat(order)),
  //      });
  //      const data = await res.json();
  //      order.pos_reference = data.id;       // store external order id
  //      order.status = 'sent_to_pos';
  //    } catch (err) {
  //      order.status = 'failed';
  //      console.error('[POS] push failed:', err);
  //    }
  //    await order.save();
  // ───────────────────────────────────────────────────────────

  order.status = 'sent_to_pos';
  await order.save();
}

/** Optional: notify the restaurant's Telegram chat about a new order. */
async function notifyTelegram(restaurant, order) {
  const token  = restaurant?.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = restaurant?.telegram?.chatId  || process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId || !fetchFn) return;

  const cur = restaurant?.currency || '₸';
  const lines = order.items.map(i => `  • ${i.quantity}× ${i.name} — ${i.price} ${cur}`).join('\n');
  const where = order.order_type === 'dine_in'
    ? `🍽️ Стол: ${order.table_number || '—'}`
    : `🚗 Адрес: ${order.customer.address || '—'}`;

  const text = [
    '🔔 *Новый заказ!*',
    '',
    where,
    `👤 ${order.customer.name || '—'}`,
    `📞 ${order.customer.phone || '—'}`,
    order.comment ? `💬 ${order.comment}` : null,
    '',
    '🧾 *Состав:*',
    lines,
    '',
    `💰 *ИТОГО: ${order.total_price} ${cur}*`,
  ].filter(Boolean).join('\n');

  try {
    await fetchFn(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
  } catch (err) {
    console.error('[Telegram] notify failed:', err.message);
  }
}

// ════════════════════════════════════════════════════════════
//  PUBLIC API
// ════════════════════════════════════════════════════════════

app.get('/api/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

/** GET /api/menu?restaurant=<slug> — public menu for the frontend. */
app.get('/api/menu', async (req, res) => {
  try {
    const restaurant = await resolveRestaurant(req.query.restaurant);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const items = await MenuItem.find({ restaurant: restaurant._id, available: true })
      .sort({ category: 1, sortOrder: 1, name: 1 });

    res.json({
      restaurant: {
        name: restaurant.name,
        slug: restaurant.slug,
        address: restaurant.address,
        phone: restaurant.phone,
        workingHours: restaurant.workingHours,
        currency: restaurant.currency,
      },
      items: items.map(i => i.toPublic()),
    });
  } catch (err) {
    console.error('GET /api/menu', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * POST /api/orders — receive an order from the frontend.
 * Body: {
 *   restaurant?: slug,
 *   order_type: 'dine_in' | 'delivery',
 *   table_number?, customer: { name, phone, address }, comment?,
 *   items: [{ id?, name?, price?, quantity }]
 * }
 */
app.post('/api/orders', async (req, res) => {
  try {
    const b = req.body || {};
    const restaurant = await resolveRestaurant(b.restaurant);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    if (!Array.isArray(b.items) || b.items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    // Rebuild the order server-side so the client cannot tamper with prices.
    const built = [];
    let total = 0;
    for (const line of b.items) {
      const qty = Math.max(1, parseInt(line.quantity ?? line.qty ?? 1, 10) || 1);
      let { name, price } = line;
      let itemRef;

      if (line.id && mongoose.isValidObjectId(line.id)) {
        const dbItem = await MenuItem.findOne({ _id: line.id, restaurant: restaurant._id });
        if (dbItem) { name = dbItem.name; price = dbItem.price; itemRef = dbItem._id; }
      }
      price = Number(price) || 0;
      if (!name) continue;

      built.push({ item: itemRef, name, price, quantity: qty });
      total += price * qty;
    }

    if (built.length === 0) return res.status(400).json({ error: 'No valid items' });

    const service = Math.round(total * 0.1);
    const totalWithService = total + service;

    const orderType = b.order_type === 'delivery' ? 'delivery' : 'dine_in';
    const order = await Order.create({
      restaurant:   restaurant._id,
      order_type:   orderType,
      table_number: orderType === 'dine_in' ? String(b.table_number || b.address || '') : '',
      customer: {
        name:    b.customer?.name    || b.name    || '',
        phone:   b.customer?.phone   || b.phone   || '',
        address: b.customer?.address || b.address || '',
      },
      comment:     b.comment || '',
      items:       built,
      total_price: totalWithService,
      status:      'pending',
    });

    // Hand off to POS + (optionally) Telegram. Don't block the response on POS.
    sendOrderToPOS(order._id).catch(err => console.error('[POS] async error:', err));
    notifyTelegram(restaurant, order).catch(() => {});

    res.status(201).json({ ok: true, orderId: order._id.toString(), status: order.status, total_price: totalWithService });
  } catch (err) {
    console.error('POST /api/orders', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ════════════════════════════════════════════════════════════
//  ADMIN AUTH
// ════════════════════════════════════════════════════════════

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  if (req.accepts('html') && !req.path.startsWith('/api/')) return res.redirect('/admin');
  return res.status(401).json({ error: 'Unauthorized' });
}

app.post('/admin/login', (req, res) => {
  const { username = '', password = '' } = req.body;
  const ok = safeEqual(username, ADMIN_USER) && safeEqual(password, ADMIN_PASS);
  if (!ok) return res.status(401).send(renderLogin('Неверный логин или пароль'));
  req.session.isAdmin = true;
  req.session.username = ADMIN_USER;
  res.redirect('/admin');
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin'));
});

app.get('/admin', (req, res) => {
  if (req.session && req.session.isAdmin) return res.send(renderDashboard());
  res.send(renderLogin());
});

// ── Admin CRUD API (JSON, session-protected) ─────────────────

app.get('/api/admin/menu-items', requireAuth, async (req, res) => {
  const restaurant = await resolveRestaurant(req.query.restaurant);
  const items = await MenuItem.find({ restaurant: restaurant._id }).sort({ category: 1, sortOrder: 1 });
  res.json(items);
});

app.post('/api/admin/menu-items', requireAuth, async (req, res) => {
  try {
    const restaurant = await resolveRestaurant(req.body.restaurant);
    const { name, price, category, image, description, badge, available, sortOrder } = req.body;
    if (!name || price == null || !category) {
      return res.status(400).json({ error: 'name, price and category are required' });
    }
    const item = await MenuItem.create({
      restaurant: restaurant._id,
      name, price, category,
      image: image || '', description: description || '', badge: badge || '',
      available: available !== false, sortOrder: Number(sortOrder) || 0,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/menu-items/:id', requireAuth, async (req, res) => {
  try {
    const fields = ['name', 'price', 'category', 'image', 'description', 'badge', 'available', 'sortOrder'];
    const update = {};
    for (const f of fields) if (f in req.body) update[f] = req.body[f];
    const item = await MenuItem.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/menu-items/:id', requireAuth, async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

/** Bonus: recent orders for the admin dashboard. */
app.get('/api/admin/orders', requireAuth, async (req, res) => {
  const restaurant = await resolveRestaurant(req.query.restaurant);
  const orders = await Order.find({ restaurant: restaurant._id }).sort({ timestamp: -1 }).limit(50);
  res.json(orders);
});

// ════════════════════════════════════════════════════════════
//  ADMIN HTML (server-rendered, no build step)
// ════════════════════════════════════════════════════════════

function pageShell(title, body) {
  return `<!DOCTYPE html><html lang="ru"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
  body{background:#14110d;color:#f3ece0;padding:24px}
  a{color:#c2913f}
  .wrap{max-width:1000px;margin:0 auto}
  h1{font-size:24px;margin-bottom:4px}.muted{color:#9a8e7c;font-size:13px}
  .card{background:#1d1813;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:20px;margin-top:18px}
  input,select,textarea{width:100%;padding:11px 12px;background:#14110d;border:1px solid rgba(255,255,255,.14);
    border-radius:7px;color:#f3ece0;font-size:14px;margin-top:6px}
  label{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#9a8e7c}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  button{background:#a9752f;color:#fff;border:none;border-radius:7px;padding:11px 18px;font-size:14px;
    font-weight:700;cursor:pointer}button:hover{background:#c2913f}
  button.ghost{background:transparent;border:1px solid rgba(255,255,255,.2)}
  button.danger{background:#a33}
  table{width:100%;border-collapse:collapse;margin-top:10px;font-size:14px}
  th,td{text-align:left;padding:10px 8px;border-bottom:1px solid rgba(255,255,255,.07)}
  th{color:#9a8e7c;font-size:11px;text-transform:uppercase;letter-spacing:1px}
  .topbar{display:flex;justify-content:space-between;align-items:center}
  .actions{display:flex;gap:6px}.actions button{padding:6px 12px;font-size:12px}
  .pill{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;background:rgba(255,255,255,.1)}
  form.inline{display:inline}
</style></head><body><div class="wrap">${body}</div></body></html>`;
}

function renderLogin(error = '') {
  return pageShell('Вход — Админ-панель', `
    <h1>QR-Menu · Админ-панель</h1>
    <p class="muted">Войдите, чтобы управлять меню</p>
    <div class="card" style="max-width:380px">
      ${error ? `<p style="color:#ff8a8a;margin-bottom:12px">${error}</p>` : ''}
      <form method="POST" action="/admin/login">
        <label>Логин</label>
        <input name="username" autocomplete="username" required/>
        <label style="margin-top:12px;display:block">Пароль</label>
        <input name="password" type="password" autocomplete="current-password" required/>
        <button type="submit" style="margin-top:16px;width:100%">Войти</button>
      </form>
    </div>`);
}

function renderDashboard() {
  // The dashboard is a thin client: it talks to the protected /api/admin/* routes.
  return pageShell('Меню — Админ-панель', `
    <div class="topbar">
      <div><h1>Управление меню</h1><p class="muted">Изменения сохраняются в базу сразу</p></div>
      <form class="inline" method="POST" action="/admin/logout"><button class="ghost">Выйти</button></form>
    </div>

    <div class="card">
      <h2 id="form-title" style="font-size:16px;margin-bottom:12px">Добавить позицию</h2>
      <input type="hidden" id="f-id"/>
      <div class="row">
        <div><label>Название *</label><input id="f-name"/></div>
        <div><label>Цена (₸) *</label><input id="f-price" type="number" min="0"/></div>
      </div>
      <div class="row" style="margin-top:10px">
        <div><label>Категория *</label><input id="f-category" placeholder="Кофе / Десерты ..."/></div>
        <div><label>Бейдж</label><input id="f-badge" placeholder="Хит / Новинка"/></div>
      </div>
      <label style="margin-top:10px;display:block">Фото (ссылка)</label><input id="f-image"/>
      <label style="margin-top:10px;display:block">Описание</label><textarea id="f-description" rows="2"></textarea>
      <div style="margin-top:14px;display:flex;gap:8px">
        <button onclick="save()">Сохранить</button>
        <button class="ghost" onclick="resetForm()">Очистить</button>
      </div>
    </div>

    <div class="card">
      <table>
        <thead><tr><th>Название</th><th>Категория</th><th>Цена</th><th>Статус</th><th></th></tr></thead>
        <tbody id="rows"><tr><td colspan="5" class="muted">Загрузка…</td></tr></tbody>
      </table>
    </div>

    <script>
      const api = '/api/admin/menu-items';
      const $ = id => document.getElementById(id);
      async function load() {
        const items = await (await fetch(api)).json();
        const rows = $('rows');
        if (!items.length) { rows.innerHTML = '<tr><td colspan=5 class=muted>Пока нет позиций</td></tr>'; return; }
        rows.innerHTML = items.map(i => \`<tr>
          <td>\${i.name}</td><td>\${i.category}</td><td>\${i.price.toLocaleString('ru-RU')} ₸</td>
          <td><span class="pill">\${i.available===false?'скрыто':'активно'}</span></td>
          <td class="actions">
            <button class="ghost" onclick='edit(\${JSON.stringify(i)})'>Изм.</button>
            <button class="danger" onclick="del('\${i._id}')">Удал.</button>
          </td></tr>\`).join('');
      }
      function resetForm(){ ['f-id','f-name','f-price','f-category','f-badge','f-image','f-description'].forEach(x=>$(x).value=''); $('form-title').textContent='Добавить позицию'; }
      function edit(i){ $('f-id').value=i._id; $('f-name').value=i.name; $('f-price').value=i.price; $('f-category').value=i.category; $('f-badge').value=i.badge||''; $('f-image').value=i.image||''; $('f-description').value=i.description||''; $('form-title').textContent='Редактировать: '+i.name; window.scrollTo({top:0,behavior:'smooth'}); }
      async function save(){
        const id = $('f-id').value;
        const body = { name:$('f-name').value.trim(), price:Number($('f-price').value),
          category:$('f-category').value.trim(), badge:$('f-badge').value.trim(),
          image:$('f-image').value.trim(), description:$('f-description').value.trim() };
        if(!body.name||!body.category||isNaN(body.price)){ alert('Заполните название, цену и категорию'); return; }
        const res = await fetch(id ? api+'/'+id : api, { method: id?'PUT':'POST',
          headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
        if(!res.ok){ alert('Ошибка: '+(await res.json()).error); return; }
        resetForm(); load();
      }
      async function del(id){ if(!confirm('Удалить позицию?'))return;
        await fetch(api+'/'+id,{method:'DELETE'}); load(); }
      load();
    </script>`);
}

// ════════════════════════════════════════════════════════════
//  STARTUP
// ════════════════════════════════════════════════════════════

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`\n🍽️  QR-Menu backend running`);
      console.log(`   App   → http://localhost:${PORT}`);
      console.log(`   Admin → http://localhost:${PORT}/admin  (user: ${ADMIN_USER})\n`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
