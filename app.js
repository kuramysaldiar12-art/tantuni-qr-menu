// ─────────────────────────────────────────────────────────────
//  APP.JS  —  Tantuni Turkish  ·  Frontend logic
//  Works in two modes:
//   • BACKEND ON  → menu from GET /api/menu, orders to POST /api/orders
//   • BACKEND OFF → menu from bundled menu-data.js, orders to Telegram
//  The switch is automatic (graceful fallback).
// ─────────────────────────────────────────────────────────────

// Telegram fallback now goes through the backend at POST /api/notify
// (no token/chat id stored or exposed in frontend code).

// ── API config ──────────────────────────────────────────────
const API_MENU   = '/api/menu';
const API_ORDERS = '/api/orders';

// Table number from the QR link, e.g.  https://site/?table=7
const urlParams    = new URLSearchParams(location.search);
const tableFromUrl = (urlParams.get('table') || urlParams.get('t') || '').trim();

// ── Cart state ──────────────────────────────────────────────
let cart = {};          // { itemId(string): quantity }
let activeCategory = 'All';
let activeTab = 'cart';
let orderType = tableFromUrl ? 'Dine-in' : 'Delivery';

// Working menu list. Starts from the bundled array (instant render,
// offline-safe) and is upgraded to the DB menu when the backend answers.
let MENU = (typeof menuData !== 'undefined') ? menuData.slice() : [];

// ── Derived helpers ─────────────────────────────────────────
// IDs may be numbers (bundled) or Mongo string ids (DB) → compare as strings.
const getItem = id => MENU.find(i => String(i.id) === String(id));

const cartItems = () =>
  Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ item: getItem(id), qty }))
    .filter(({ item }) => item);          // drop ids no longer in the menu

const cartCount = () => cartItems().reduce((s, { qty }) => s + qty, 0);

const cartTotal = () =>
  cartItems().reduce((s, { item, qty }) => s + item.price * qty, 0);

const fmt = n => Number(n).toLocaleString('ru-RU');
const escapeAttr = s => String(s).replace(/"/g, '&quot;');

// ── Categories (computed live from the current menu) ─────────
function getCategories() {
  return ['All', ...new Set(MENU.map(i => i.category))];
}

function buildCatNav() {
  const nav = document.getElementById('cat-nav');
  nav.innerHTML = getCategories().map(c => `
    <button class="cat-btn${c === activeCategory ? ' active' : ''}"
            onclick="selectCategory('${c}')">${c}</button>
  `).join('');
}

function selectCategory(cat) {
  activeCategory = cat;
  document.getElementById('menu-label').textContent =
    cat === 'All' ? 'Все блюда' : cat;
  buildCatNav();
  renderGrid();
}

// ── Grid ─────────────────────────────────────────────────────
function renderGrid() {
  const filtered = activeCategory === 'All'
    ? MENU
    : MENU.filter(i => i.category === activeCategory);

  document.getElementById('menu-grid').innerHTML =
    filtered.map((item, i) => cardHTML(item, i)).join('');
  observeReveals();
}

function cardHTML(item, i = 0) {
  const qty = cart[item.id] || 0;
  const delay = (i % 4) * 70;   // лёгкая «волна» по ряду
  const badge = item.badge
    ? `<div class="card-badge">${item.badge}</div>` : '';

  const action = qty > 0
    ? `<div class="qty-ctrl">
        <button onclick="changeQty('${item.id}', -1)">−</button>
        <span class="qty-num">${qty}</span>
        <button onclick="changeQty('${item.id}', 1)">+</button>
       </div>`
    : `<button class="add-btn" id="addbtn-${item.id}"
              onclick="addToCart('${item.id}')">+</button>`;

  return `
    <div class="card reveal" id="card-${item.id}" style="transition-delay:${delay}ms">
      <div class="card-img-wrap">
        <img class="card-img" src="${item.image}"
             alt="${item.name}" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80'"/>
        ${badge}
      </div>
      <div class="card-body">
        <div class="card-name">${item.name}</div>
        <div class="card-desc">${item.description || ''}</div>
        <div class="card-footer">
          <div class="card-price">${fmt(item.price)} ₸</div>
          ${action}
        </div>
      </div>
    </div>`;
}

// ── Cart mutations ───────────────────────────────────────────
function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  const btn = document.getElementById(`addbtn-${id}`);
  if (btn) { btn.classList.add('bump'); setTimeout(() => btn.classList.remove('bump'), 300); }
  updateCardFooter(id);
  updateCartBar();
  showToast(`Добавлено в корзину ✓`);
}

function changeQty(id, delta) {
  cart[id] = Math.max(0, (cart[id] || 0) + delta);
  if (cart[id] === 0) delete cart[id];
  updateCardFooter(id);
  updateCartBar();
  if (activeTab === 'cart') renderCartBody();
}

function updateCardFooter(id) {
  const card = document.getElementById(`card-${id}`);
  if (!card) return;
  const item = getItem(id);
  if (!item) return;
  const footer = card.querySelector('.card-footer');
  const qty = cart[id] || 0;
  const action = qty > 0
    ? `<div class="qty-ctrl">
        <button onclick="changeQty('${id}', -1)">−</button>
        <span class="qty-num">${qty}</span>
        <button onclick="changeQty('${id}', 1)">+</button>
       </div>`
    : `<button class="add-btn" id="addbtn-${id}"
              onclick="addToCart('${id}')">+</button>`;
  footer.innerHTML = `<div class="card-price">${fmt(item.price)} ₸</div>${action}`;
}

function updateCartBar() {
  const count = cartCount();
  const bar = document.getElementById('cart-bar');
  document.getElementById('cart-count').textContent = count;
  document.getElementById('cart-total-display').textContent = `${fmt(cartTotal())} ₸`;
  bar.classList.toggle('has-items', count > 0);
}

// ── Cart Drawer ──────────────────────────────────────────────
function openCart() {
  document.getElementById('cart-overlay').classList.add('open');
  document.getElementById('cart-drawer').classList.add('open');
  document.body.style.overflow = 'hidden';
  switchTab('cart');
}

function closeCart() {
  document.getElementById('cart-overlay').classList.remove('open');
  document.getElementById('cart-drawer').classList.remove('open');
  document.body.style.overflow = '';
}

function switchTab(tab) {
  activeTab = tab;
  document.getElementById('tab-cart').classList.toggle('active', tab === 'cart');
  document.getElementById('tab-checkout').classList.toggle('active', tab === 'checkout');
  if (tab === 'cart') renderCartBody();
  else renderCheckoutBody();
}

// ── Cart tab body ────────────────────────────────────────────
function renderCartBody() {
  const body = document.getElementById('drawer-body');
  const items = cartItems();

  if (items.length === 0) {
    body.innerHTML = `
      <div class="empty-cart">
        <div class="empty-icon">🛒</div>
        <p>Корзина пуста.<br/>Добавьте что-нибудь вкусное!</p>
      </div>`;
    return;
  }

  const itemsHTML = items.map(({ item, qty }) => `
    <div class="cart-item">
      <img class="cart-item-img" src="${item.image}" alt="${item.name}"
           onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80'"/>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${fmt(item.price * qty)} ₸</div>
      </div>
      <div class="cart-item-qty">
        <button class="ciq-btn" onclick="changeQty('${item.id}', -1)">−</button>
        <span class="ciq-num">${qty}</span>
        <button class="ciq-btn" onclick="changeQty('${item.id}', 1)">+</button>
      </div>
    </div>`).join('');

  const total = cartTotal();

  body.innerHTML = `
    ${itemsHTML}
    <div class="cart-summary">
      <div class="cart-summary-row total">
        <span>Итого</span><span>${fmt(total)} ₸</span>
      </div>
    </div>
    <button class="cart-next-btn" onclick="switchTab('checkout')">
      Оформить заказ →
    </button>`;
}

// ── Checkout tab body ─────────────────────────────────────────
function renderCheckoutBody() {
  if (cartItems().length === 0) {
    switchTab('cart');
    return;
  }
  const body = document.getElementById('drawer-body');
  // Prefill the table number from the QR link when dining in.
  const addrValue = (orderType === 'Dine-in' && tableFromUrl) ? escapeAttr(tableFromUrl) : '';

  body.innerHTML = `
    <div class="form-group">
      <div class="form-label">Тип заказа</div>
      <div class="order-type-selector">
        <div class="order-type-opt${orderType === 'Delivery' ? ' selected' : ''}"
             onclick="selectOrderType('Delivery')">🚗 Доставка</div>
        <div class="order-type-opt${orderType === 'Dine-in' ? ' selected' : ''}"
             onclick="selectOrderType('Dine-in')">🍽️ В зале</div>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Ваше имя</label>
      <input class="form-input" id="f-name" type="text"
             placeholder="напр. Иван Иванов" autocomplete="name"/>
    </div>
    <div class="form-group">
      <label class="form-label">Номер телефона</label>
      <input class="form-input" id="f-phone" type="tel"
             placeholder="+7 (___) ___-__-__" autocomplete="tel"/>
    </div>
    <div class="form-group">
      <label class="form-label" id="addr-label">
        ${orderType === 'Dine-in' ? 'Номер стола' : 'Адрес доставки'}
      </label>
      <input class="form-input" id="f-addr" type="text" value="${addrValue}"
             placeholder="${orderType === 'Dine-in' ? 'напр. Стол 7' : 'Улица, дом, квартира'}"
             autocomplete="street-address"/>
    </div>
    <div class="form-group">
      <label class="form-label">Комментарий (необязательно)</label>
      <input class="form-input" id="f-comment" type="text"
             placeholder="Аллергии, пожелания…"/>
    </div>
    <button class="place-order-btn" onclick="placeOrder()">Оформить заказ</button>
    <div style="height:20px"></div>`;
}

function selectOrderType(type) {
  orderType = type;
  renderCheckoutBody();
}

// ── Place Order ──────────────────────────────────────────────
async function placeOrder() {
  const kzNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Almaty' }));
  const kzMin = kzNow.getHours() * 60 + kzNow.getMinutes();
  if (kzMin < 10 * 60) {
    showToast('К сожалению, кафе сейчас закрыто. Прием заказов с 10:00 до 00:00!');
    return;
  }
  if (kzMin >= 23 * 60 && orderType !== 'Delivery') {
    showToast('После 23:00 принимаем только заказы на вынос (доставка)');
    return;
  }

  const name    = document.getElementById('f-name')?.value.trim();
  const phone   = document.getElementById('f-phone')?.value.trim();
  const addr    = document.getElementById('f-addr')?.value.trim();
  const comment = document.getElementById('f-comment')?.value.trim();

  if (!name || !phone || !addr) {
    showToast('Заполните все обязательные поля');
    return;
  }

  const btn = document.querySelector('.place-order-btn');
  btn.disabled = true;
  btn.textContent = 'Отправляем…';

  const items   = cartItems();
  const total   = cartTotal();
  const isDineIn = orderType === 'Dine-in';
  const tableNumber = isDineIn ? (tableFromUrl || addr) : '';

  // Structured payload for the backend (/api/orders).
  const payload = {
    order_type:   isDineIn ? 'dine_in' : 'delivery',
    table_number: tableNumber,
    customer: {
      name,
      phone,
      address: isDineIn ? '' : addr,
    },
    comment: comment || '',
    items: items.map(({ item, qty }) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: qty,
    })),
    subtotal: total,
    total_price: total,
  };

  // 1) Try the backend first.
  try {
    const res = await fetch(API_ORDERS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) { finishOrderSuccess(); return; }

    // Our backend returns JSON 4xx for real validation errors → show them.
    const ct = res.headers.get('content-type') || '';
    if (res.status >= 400 && res.status < 500 && res.status !== 404 && res.status !== 405 && ct.includes('application/json')) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || 'Не удалось оформить заказ');
    }
    // 404/405/5xx/non-JSON → endpoint not available (static hosting) → fall back.
    throw { __fallback: true };
  } catch (err) {
    if (err && err.__fallback) return sendOrderViaTelegram(payload, btn);
    if (err instanceof TypeError) return sendOrderViaTelegram(payload, btn); // network/refused
    // A genuine backend error:
    btn.disabled = false;
    btn.textContent = 'Оформить заказ';
    showToast(err.message || 'Ошибка отправки');
  }
}

// Fallback path: send the order straight to Telegram (no backend).
async function sendOrderViaTelegram(payload, btn) {
  const itemLines = payload.items
    .map(i => `  • ${i.quantity}× ${i.name} — ${fmt(i.price)} ₸`)
    .join('\n');

  const text = [
    `🔔 *Новый заказ!*`,
    ``,
    `📦 *Тип:* ${payload.order_type === 'delivery' ? 'Доставка' : 'В зале'}`,
    `👤 *Имя:* ${payload.customer.name}`,
    `📞 *Телефон:* ${payload.customer.phone}`,
    payload.order_type === 'dine_in'
      ? `🍽️ *Стол:* ${payload.table_number || '—'}`
      : `📍 *Адрес:* ${payload.customer.address || '—'}`,
    payload.comment ? `💬 *Комментарий:* ${payload.comment}` : null,
    ``,
    `🍽️ *Состав заказа:*`,
    itemLines,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💰 *ИТОГО: ${fmt(payload.total_price)} ₸*`,
  ].filter(l => l !== null).join('\n');

  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('notify failed');
    finishOrderSuccess();
  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = 'Оформить заказ'; }
    showToast('Ошибка отправки заказа. Позвоните нам, пожалуйста.');
    console.log('Order (no backend/Telegram reachable):', text);
  }
}

function finishOrderSuccess() {
  closeCart();
  document.getElementById('success-screen').classList.add('show');
}

// ── Reset ────────────────────────────────────────────────────
function resetApp() {
  cart = {};
  document.getElementById('success-screen').classList.remove('show');
  updateCartBar();
  renderGrid();
}

// ── Toast ────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
}

// ── Open/Closed status ───────────────────────────────────────
function updateOpenStatus() {
  // Атырау — UTC+5, работает корректно на любом устройстве мира
  const now = new Date();
  const kzTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Almaty' }));
  const totalMin = kzTime.getHours() * 60 + kzTime.getMinutes();
  const open  = 10 * 60;  // 10:00
  const close = 24 * 60;       // 24:00 (полночь)
  const el = document.getElementById('open-status');
  if (!el) return;
  // открыто ежедневно с 10:00 до 24:00
  if (totalMin >= open && totalMin < close) {
    el.textContent = '● Открыто';
    el.style.color = '#3ecf4a';
  } else {
    el.textContent = '● Закрыто';
    el.style.color = '#e05555';
  }
}
updateOpenStatus();
setInterval(updateOpenStatus, 60000);

// ── Top nav: solid on scroll + mobile menu ──────────────────
function toggleNav(open) {
  document.getElementById('mobile-menu').classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

const topnav = document.getElementById('topnav');
function onScroll() {
  if (!topnav) return;
  topnav.classList.toggle('solid', window.scrollY > 40);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ── Footer year ──────────────────────────────────────────────
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ── Отзывы ───────────────────────────────────────────────────
const REVIEWS_KEY = 'urbo_reviews';

function getStoredReviews() {
  try { return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || []; }
  catch { return []; }
}

function renderReviews() {
  const grid = document.getElementById('reviews-container');
  if (!grid) return;
  const base = (typeof reviewsData !== 'undefined') ? reviewsData : [];
  // Свежие отзывы гостей показываем первыми
  const all = [...getStoredReviews().reverse(), ...base];
  grid.innerHTML = all.map((r, i) => `
    <div class="rev-card reveal" style="transition-delay:${(i % 3) * 90}ms">
      ${r.rating ? `<div class="rev-card-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>` : ''}
      <div class="quote">«${r.quote}»</div>
      <div class="who">${r.name}</div>
      <div class="src">${r.source}</div>
    </div>`).join('');
  observeReveals();
}

// ── Форма отзыва ─────────────────────────────────────────────
function submitReview() {
  const name = document.getElementById('rv-name').value.trim();
  const text = document.getElementById('rv-text').value.trim();
  if (!name || !text) { showToast('Заполните имя и текст отзыва'); return; }

  const review = { quote: text, name, source: 'Гость сайта', date: Date.now() };
  const arr = getStoredReviews();
  arr.push(review);
  try { localStorage.setItem(REVIEWS_KEY, JSON.stringify(arr)); } catch {}
  renderReviews();

  const msg = `⭐ *Новый отзыв на сайте*\n\n👤 ${name}\n\n«${text}»`;
  fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: msg })
  }).catch(() => console.log('Review (no backend reachable):', msg));

  document.getElementById('rv-name').value = '';
  document.getElementById('rv-text').value = '';
  showToast('Спасибо за отзыв! 🙏');
}

// ── Cookie-согласие ──────────────────────────────────────────
const COOKIE_KEY = 'urbo_cookie';

function setCookieConsent(ok) {
  try { localStorage.setItem(COOKIE_KEY, ok ? 'yes' : 'no'); } catch {}
  document.getElementById('cookie-bar').classList.remove('show');
}
function initCookie() {
  let saved = null;
  try { saved = localStorage.getItem(COOKIE_KEY); } catch {}
  if (saved === null) {
    setTimeout(() => document.getElementById('cookie-bar').classList.add('show'), 900);
  }
}

// ── Появление при прокрутке ──────────────────────────────────
const revealObserver = ('IntersectionObserver' in window)
  ? new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
  : null;

function observeReveals() {
  const els = document.querySelectorAll('.reveal:not(.visible)');
  if (!revealObserver) { els.forEach(el => el.classList.add('visible')); return; }
  els.forEach(el => revealObserver.observe(el));
}

// ── Menu loading: backend with graceful fallback ─────────────
async function loadMenuFromBackend() {
  try {
    const res = await fetch(API_MENU, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;   // static host served HTML/404
    const data = await res.json();
    if (!data || !Array.isArray(data.items) || data.items.length === 0) return null;
    return data;
  } catch {
    return null;   // network error / no backend
  }
}

async function initMenu() {
  // Render the bundled menu immediately (fast + works with no backend)…
  buildCatNav();
  renderGrid();

  // …then upgrade to the live DB menu if the backend is reachable.
  const data = await loadMenuFromBackend();
  if (data && data.items) {
    MENU = data.items;
    cart = {};               // ids differ between bundled/DB — start clean
    updateCartBar();
    buildCatNav();
    renderGrid();
  }
}

// ── Init ─────────────────────────────────────────────────────
initMenu();
renderReviews();
observeReveals();
initCookie();
