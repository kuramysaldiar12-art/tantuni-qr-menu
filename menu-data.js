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
  // ── Тантуни ───────────────────────────────────────────────
  { id: '1', name: 'Тантуни с говядиной', price: 1800, category: 'Тантуни', image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80', description: 'Тонко нарезанная говядина на садже, тонкий лаваш, лук, помидор и зелень', badge: 'Хит' },
  { id: '2', name: 'Тантуни с курицей',   price: 1600, category: 'Тантуни', image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&q=80', description: 'Сочная курица на садже, лаваш, сумах, петрушка и лимон' },
  { id: '3', name: 'Тантуни микс',        price: 2000, category: 'Тантуни', image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&q=80', description: 'Говядина и курица вместе, фирменные специи и свежие овощи' },
  { id: '4', name: 'Тантуни дюрюм',       price: 2200, category: 'Тантуни', image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80', description: 'Большой дюрюм с двойной порцией мяса и острым соусом', badge: 'Большой' },

  // ── Донеры и дюрюмы ───────────────────────────────────────
  { id: '5', name: 'Донер в лаваше',      price: 1500, category: 'Донеры и дюрюмы', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80', description: 'Классический донер из говядины, картофель фри внутри, чесночный соус' },
  { id: '6', name: 'Донер в булке',       price: 1400, category: 'Донеры и дюрюмы', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', description: 'Сочный донер в свежей булочке с овощами и соусами' },
  { id: '7', name: 'Дюрюм с курицей',     price: 1500, category: 'Донеры и дюрюмы', image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80', description: 'Куриный донер в тонком лаваше с маринованными овощами' },
  { id: '8', name: 'Искендер-кебаб',      price: 2600, category: 'Донеры и дюрюмы', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80', description: 'Донер на кусочках пиде, томатный соус, топлёное масло и йогурт', badge: 'Фирменное' },
  { id: '9', name: 'Адана-кебаб',         price: 2200, category: 'Донеры и дюрюмы', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80', description: 'Острый рубленый кебаб на гриле, лаваш, лук с сумахом' },

  // ── Гарниры и пиде ────────────────────────────────────────
  { id: '10', name: 'Картофель фри',       price: 700,  category: 'Гарниры и пиде', image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&q=80', description: 'Золотистый, хрустящий, с солью' },
  { id: '11', name: 'Пиде с сыром',        price: 1900, category: 'Гарниры и пиде', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', description: 'Турецкая лодочка из теста с тянущимся сыром кашар' },
  { id: '12', name: 'Пиде с мясом',        price: 2100, category: 'Гарниры и пиде', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', description: 'Кыймалы пиде с рубленой говядиной и специями' },
  { id: '13', name: 'Лахмаджун',           price: 1200, category: 'Гарниры и пиде', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80', description: 'Тонкая турецкая лепёшка с мясным фаршем, зеленью и лимоном', badge: 'Новинка' },
  { id: '14', name: 'Чечевичный суп',      price: 900,  category: 'Гарниры и пиде', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80', description: 'Мерджимек — нежный суп-пюре из красной чечевицы' },
  { id: '15', name: 'Турецкий салат',      price: 800,  category: 'Гарниры и пиде', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80', description: 'Чобан-салат: помидоры, огурцы, лук, перец и зелень' },

  // ── Напитки ───────────────────────────────────────────────
  { id: '16', name: 'Айран',               price: 500,  category: 'Напитки', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80', description: 'Освежающий йогуртовый напиток' },
  { id: '17', name: 'Турецкий чай',        price: 300,  category: 'Напитки', image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&q=80', description: 'Классический чёрный чай в стакане-тюльпане' },
  { id: '18', name: 'Кола',                price: 600,  category: 'Напитки', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80', description: 'Охлаждённая, 0.33 л' },
  { id: '19', name: 'Шалгам',              price: 600,  category: 'Напитки', image: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80', description: 'Острый сок из чёрной моркови и репы' },
  { id: '20', name: 'Домашний лимонад',    price: 700,  category: 'Напитки', image: 'https://images.unsplash.com/photo-1560508180-03f285f67ded?w=400&q=80', description: 'Свежий лимонад с мятой' },
  { id: '21', name: 'Турецкий кофе',       price: 800,  category: 'Напитки', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80', description: 'Сваренный на песке, по традиционному рецепту' },
];

// ─────────────────────────────────────────────────────────────
//  ОТЗЫВЫ — чтобы добавить, скопируйте блок { ... } и впишите
//  свой текст. quote — отзыв, name — кто оставил, source — откуда.
// ─────────────────────────────────────────────────────────────

const reviewsData = [
  {
    quote: 'Тантуни как в Стамбуле! Мясо сочное, лаваш тонкий — пальчики оближешь.',
    name: 'Арман',
    source: '2GIS'
  },
  {
    quote: 'Искендер просто бомба, порции большие. Теперь только сюда за донером.',
    name: 'Жанна',
    source: 'Яндекс Карты'
  },
  {
    quote: 'Быстро, вкусно и недорого. Айран и лахмаджун — мастхэв!',
    name: 'Тимур',
    source: 'Instagram'
  }
];
