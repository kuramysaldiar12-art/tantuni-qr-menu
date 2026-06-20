// ─────────────────────────────────────────────────────────────
//  МЕНЮ — TANTUNI TURKISH · «Уличный вкус Стамбула»
//  Структура позиции (НЕ менять имена полей — их читают app.js
//  и backend):
//    { id: '<строка>', name, price (число, KZT), category,
//      image (ссылка на фото), description, badge (необязательно) }
//
//  Чтобы поставить своё фото — замените значение `image`.
// ─────────────────────────────────────────────────────────────

const menuData = [
  // ── Тантуни (официальное меню Instagram @tantuni_turkish) ──
  { id: '22', name: 'Тантуни с курицей (Tavuklu tantuni)',         price: 1950, category: 'Тантуни', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80', description: 'Салат, лимон, халапеньо + 1 турецкий чай в подарок' },
  { id: '23', name: 'Тантуни с курицей в булке (Ekmekli tavuk)',   price: 1950, category: 'Тантуни', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80', description: 'Салат, лимон, халапеньо + 1 турецкий чай в подарок' },
  { id: '24', name: 'Тантуни с курицей и йогуртом (Yoğurtlu tavuk)', price: 2600, category: 'Тантуни', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80', description: 'Салат, лимон, халапеньо + 1 турецкий чай в подарок' },
  { id: '25', name: 'Тантуни с говядиной (лаваш)',    price: 2400, category: 'Тантуни', image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80', description: 'Etli tantuni — салат, лимон, халапеньо + 1 турецкий чай в подарок' },
  { id: '26', name: 'Тантуни с говядиной в булке',    price: 2400, category: 'Тантуни', image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80', description: 'Ekmekli et tantuni — салат, лимон, халапеньо + 1 турецкий чай в подарок' },
  { id: '27', name: 'Тантуни с говядиной и йогуртом', price: 3000, category: 'Тантуни', image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80', description: 'Yoğurtlu etli tantuni — салат, лимон, халапеньо + 1 турецкий чай в подарок' },

  // ── Бургеры ─────────────────────────────────────────────────
  { id: '28', name: 'Тантуни бургер',     price: 2400, category: 'Бургеры', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80', description: 'Фирменный бургер Tantuni Burger' },
  { id: '29', name: 'Тантуни чизбургер',  price: 2600, category: 'Бургеры', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80', description: 'Tantuni Burger с сыром', badge: 'Новинка' },

  // ── Сладости (фото временно общие — замените на свои) ──────
  { id: '30', name: 'Баклава',                    price: 1500, category: 'Сладости', image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&q=80', description: 'Baklava' },
  { id: '31', name: 'Молочная баклава (3 шт)',    price: 1500, category: 'Сладости', image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&q=80', description: 'Sütlü baklava' },
  { id: '32', name: 'Морковная пахлава, порция (Havuç baklava)',   price: 1500, category: 'Сладости', image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&q=80', description: 'Турецкая пахлава с морковным кремом' },
  { id: '33', name: 'Морковная пахлава, кусок (Havuç baklavası)',  price: 1200, category: 'Сладости', image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&q=80', description: 'Турецкая пахлава с морковным кремом' },
  { id: '34', name: 'Морковная пахлава на двоих (Havuç baklavası)', price: 2400, category: 'Сладости', image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&q=80', description: 'Турецкая пахлава с морковным кремом' },
  { id: '35', name: 'Мидия баклава',              price: 500,  category: 'Сладости', image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&q=80', description: 'Midye baklavası' },
  { id: '36', name: 'Стакан чая',                 price: 350,  category: 'Сладости', image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&q=80', description: 'Bardak çay' },

  // ── Напитки (официальное меню Instagram) ───────────────────
  { id: '37', name: 'Coca-Cola 0.5л',  price: 600,  category: 'Напитки', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80', description: '' },
  { id: '38', name: 'Coca-Cola 1л',    price: 800,  category: 'Напитки', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80', description: '' },
  { id: '39', name: 'Fanta 0.5л',      price: 600,  category: 'Напитки', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80', description: '' },
  { id: '40', name: 'Fanta 1л',        price: 800,  category: 'Напитки', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80', description: '' },
  { id: '41', name: 'Sprite 0.5л',     price: 500,  category: 'Напитки', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80', description: '' },
  { id: '42', name: 'Sprite 1л',       price: 800,  category: 'Напитки', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80', description: '' },
  { id: '43', name: 'Су Бонаква 0.5л', price: 500,  category: 'Напитки', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80', description: '' },
  { id: '44', name: 'Су Бонаква 1л',   price: 800,  category: 'Напитки', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80', description: '' },
  { id: '45', name: 'Айран',           price: 450,  category: 'Напитки', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80', description: '' },
  { id: '46', name: 'Сок (трубочка)',  price: 350,  category: 'Напитки', image: 'https://images.unsplash.com/photo-1560508180-03f285f67ded?w=400&q=80', description: '' },
  { id: '47', name: 'Турецкий кофе',   price: 1000, category: 'Напитки', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80', description: 'Türk kahvesi' },
  { id: '48', name: 'Турецкий чай',    price: 1600, category: 'Напитки', image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&q=80', description: 'Türk çayı' },
];

// ─────────────────────────────────────────────────────────────
//  ОТЗЫВЫ — чтобы добавить, скопируйте блок { ... } и впишите
//  свой текст. quote — отзыв, name — кто оставил, source — откуда.
// ─────────────────────────────────────────────────────────────

const reviewsData = [];
