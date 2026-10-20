/**
 * NE3XA Shop — filtering, sorting, search, product rendering
 */

(function () {
  'use strict';

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function renderProducts(products, container) {
    if (!container) return;
    if (!products.length) {
      container.innerHTML = `
        <div class="empty-cart" style="grid-column:1/-1;">
          <p>No laptops match your filters. Try adjusting search or category.</p>
          <button class="btn btn-outline mt-2" id="clear-filters">Clear filters</button>
        </div>`;
      const clearBtn = document.getElementById('clear-filters');
      if (clearBtn) clearBtn.addEventListener('click', resetFilters);
      return;
    }
    container.innerHTML = products.map(p => `
      <article class="product-card" data-id="${p.id}">
        <a href="product.html?id=${p.id}" class="product-image">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          ${p.stock < 5 ? '<span class="product-badge">Low stock</span>' : `<span class="product-badge">${p.category}</span>`}
        </a>
        <div class="product-body">
          <a href="product.html?id=${p.id}" class="product-name">${p.name}</a>
          <p class="product-specs">${p.brand} · ${p.processor} · ${p.ram} · ${p.storage}</p>
          <p class="product-price">${window.NE3XA.formatPrice(p.price)}</p>
          <div class="product-actions">
            <button class="btn btn-primary btn-sm add-cart-btn" data-id="${p.id}">Add to cart</button>
            <a href="product.html?id=${p.id}" class="btn btn-outline btn-sm">Details</a>
          </div>
        </div>
      </article>
    `).join('');

    container.querySelectorAll('.add-cart-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prod = window.NE3XA.getProduct(btn.dataset.id);
        if (prod) {
          window.NE3XA.cart.add({ id: prod.id, name: prod.name, price: prod.price, image: prod.image, qty: 1 });
          btn.textContent = 'Added';
          setTimeout(() => { btn.textContent = 'Add to cart'; }, 1400);
        }
      });
    });
  }

  function applyFilters() {
    const search = (document.getElementById('shop-search')?.value || '').toLowerCase().trim();
    const category = document.getElementById('filter-category')?.value || '';
    const brand = document.getElementById('filter-brand')?.value || '';
    const ram = document.getElementById('filter-ram')?.value || '';
    const sort = document.getElementById('filter-sort')?.value || 'recommended';
    const priceMax = document.getElementById('filter-price')?.value || '';

    let list = [...window.NE3XA.products];

    if (search) {
      list = list.filter(p => {
        const hay = [p.name, p.brand, p.processor, p.ram, p.storage, p.category, p.description, ...(p.tags || [])].join(' ').toLowerCase();
        return hay.includes(search);
      });
    }
    if (category) list = list.filter(p => p.category === category);
    if (brand) list = list.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
    if (ram) list = list.filter(p => p.ram === ram);
    if (priceMax) list = list.filter(p => p.price <= Number(priceMax));

    switch (sort) {
      case 'price-asc': list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'newest': list = list.reverse(); break;
      default: break;
    }

    const countEl = document.getElementById('results-count');
    if (countEl) countEl.textContent = list.length + ' product' + (list.length !== 1 ? 's' : '');

    renderProducts(list, document.getElementById('product-grid'));
  }

  function resetFilters() {
    const search = document.getElementById('shop-search');
    const cat = document.getElementById('filter-category');
    const brand = document.getElementById('filter-brand');
    const ram = document.getElementById('filter-ram');
    const sort = document.getElementById('filter-sort');
    const price = document.getElementById('filter-price');
    if (search) search.value = '';
    if (cat) cat.value = '';
    if (brand) brand.value = '';
    if (ram) ram.value = '';
    if (sort) sort.value = 'recommended';
    if (price) price.value = '';
    applyFilters();
  }

  function initShop() {
    const grid = document.getElementById('product-grid');
    if (!grid || !window.NE3XA.products) return;

    // Pre-select category from URL
    const catParam = getQueryParam('cat');
    const catSelect = document.getElementById('filter-category');
    if (catParam && catSelect) {
      catSelect.value = catParam;
    }

    // Populate brand options
    const brandSelect = document.getElementById('filter-brand');
    if (brandSelect) {
      const brands = [...new Set(window.NE3XA.products.map(p => p.brand))].sort();
      brands.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = b;
        brandSelect.appendChild(opt);
      });
    }

    ['shop-search', 'filter-category', 'filter-brand', 'filter-ram', 'filter-sort', 'filter-price'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener(el.tagName === 'INPUT' && el.type === 'text' ? 'input' : 'change', applyFilters);
      }
    });

    applyFilters();
  }

  // Cart page
  function renderCartPage() {
    const body = document.getElementById('cart-body');
    const summary = document.getElementById('cart-summary');
    const empty = document.getElementById('cart-empty');
    if (!body) return;

    const cart = window.NE3XA.cart.get();
    if (!cart.length) {
      body.style.display = 'none';
      if (summary) summary.style.display = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    body.style.display = 'block';
    if (summary) summary.style.display = 'block';

    const tbody = document.getElementById('cart-items');
    if (tbody) {
      tbody.innerHTML = cart.map(item => `
        <tr data-id="${item.id}">
          <td>
            <div class="cart-product">
              <img class="cart-product-img" src="${item.image || 'images/laptop-1.svg'}" alt="">
              <div>
                <strong>${item.name}</strong>
                <div class="text-sm" style="color:var(--mid-grey);">${window.NE3XA.formatPrice(item.price)} each</div>
              </div>
            </div>
          </td>
          <td>
            <div class="qty-control">
              <button type="button" class="qty-minus" aria-label="Decrease">−</button>
              <span>${item.qty}</span>
              <button type="button" class="qty-plus" aria-label="Increase">+</button>
            </div>
          </td>
          <td><strong>${window.NE3XA.formatPrice(item.price * item.qty)}</strong></td>
          <td><button type="button" class="btn btn-ghost btn-sm remove-item" aria-label="Remove">Remove</button></td>
        </tr>
      `).join('');

      tbody.querySelectorAll('tr').forEach(row => {
        const id = row.dataset.id;
        row.querySelector('.qty-minus')?.addEventListener('click', () => {
          const item = window.NE3XA.cart.get().find(i => i.id === id);
          if (item && item.qty > 1) window.NE3XA.cart.updateQty(id, item.qty - 1);
          else window.NE3XA.cart.remove(id);
          renderCartPage();
        });
        row.querySelector('.qty-plus')?.addEventListener('click', () => {
          const item = window.NE3XA.cart.get().find(i => i.id === id);
          if (item) window.NE3XA.cart.updateQty(id, item.qty + 1);
          renderCartPage();
        });
        row.querySelector('.remove-item')?.addEventListener('click', () => {
          window.NE3XA.cart.remove(id);
          renderCartPage();
        });
      });
    }

    const subtotal = window.NE3XA.cart.total();
    const delivery = subtotal > 0 ? 25 : 0;
    const total = subtotal + delivery;
    const subEl = document.getElementById('cart-subtotal');
    const delEl = document.getElementById('cart-delivery');
    const totEl = document.getElementById('cart-total');
    if (subEl) subEl.textContent = window.NE3XA.formatPrice(subtotal);
    if (delEl) delEl.textContent = window.NE3XA.formatPrice(delivery);
    if (totEl) totEl.textContent = window.NE3XA.formatPrice(total);
  }

  // Product detail page
  function initProductPage() {
    const id = getQueryParam('id');
    const product = id ? window.NE3XA.getProduct(id) : null;
    const root = document.getElementById('product-detail');
    if (!root) return;

    if (!product) {
      root.innerHTML = '<p>Product not found. <a href="index.html">Back to Home</a></p>';
      return;
    }

    document.title = product.name + ' — NE3XA';
    root.innerHTML = `
      <div class="two-col" style="align-items:start;">
        <div>
          <div class="product-image" style="aspect-ratio:4/3;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;">
            <img src="${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">
          </div>
        </div>
        <div>
          <p class="text-sm" style="color:var(--mid-grey);margin-bottom:0.5rem;">${product.brand} · ${product.category}</p>
          <h1 style="font-size:1.75rem;margin-bottom:0.75rem;">${product.name}</h1>
          <p class="product-price" style="font-size:1.5rem;margin-bottom:1.25rem;">${window.NE3XA.formatPrice(product.price)}</p>
          <p style="margin-bottom:1.5rem;">${product.description}</p>
          <table style="width:100%;font-size:0.9rem;margin-bottom:1.5rem;">
            <tr><td style="padding:0.4rem 0;color:var(--mid-grey);">Processor</td><td style="padding:0.4rem 0;">${product.processor}</td></tr>
            <tr><td style="padding:0.4rem 0;color:var(--mid-grey);">RAM</td><td style="padding:0.4rem 0;">${product.ram}</td></tr>
            <tr><td style="padding:0.4rem 0;color:var(--mid-grey);">Storage</td><td style="padding:0.4rem 0;">${product.storage}</td></tr>
            <tr><td style="padding:0.4rem 0;color:var(--mid-grey);">Display</td><td style="padding:0.4rem 0;">${product.display}</td></tr>
            <tr><td style="padding:0.4rem 0;color:var(--mid-grey);">OS</td><td style="padding:0.4rem 0;">${product.os}</td></tr>
            <tr><td style="padding:0.4rem 0;color:var(--mid-grey);">Stock</td><td style="padding:0.4rem 0;">${product.stock > 0 ? product.stock + ' available' : 'Out of stock'}</td></tr>
          </table>
          <div class="flex gap-2 items-center" style="margin-bottom:1rem;">
            <div class="qty-control">
              <button type="button" id="pd-minus">−</button>
              <span id="pd-qty">1</span>
              <button type="button" id="pd-plus">+</button>
            </div>
            <button class="btn btn-primary" id="pd-add" ${product.stock < 1 ? 'disabled' : ''}>Add to cart</button>
          </div>
          <a href="laptops.html" class="btn btn-ghost btn-sm">← Back to store</a>
        </div>
      </div>
      <div class="mt-4">
        <h3 style="margin-bottom:1rem;">Related products</h3>
        <div class="product-grid" id="related-grid"></div>
      </div>
    `;

    let qty = 1;
    const qtyEl = document.getElementById('pd-qty');
    document.getElementById('pd-minus')?.addEventListener('click', () => {
      qty = Math.max(1, qty - 1);
      qtyEl.textContent = qty;
    });
    document.getElementById('pd-plus')?.addEventListener('click', () => {
      qty = Math.min(product.stock, qty + 1);
      qtyEl.textContent = qty;
    });
    document.getElementById('pd-add')?.addEventListener('click', () => {
      window.NE3XA.cart.add({ id: product.id, name: product.name, price: product.price, image: product.image, qty });
      const btn = document.getElementById('pd-add');
      btn.textContent = 'Added to cart';
      setTimeout(() => { btn.textContent = 'Add to cart'; }, 1600);
    });

    const related = window.NE3XA.products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
    renderProducts(related, document.getElementById('related-grid'));
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('product-grid')) initShop();
    if (document.getElementById('cart-body') || document.getElementById('cart-empty')) renderCartPage();
    if (document.getElementById('product-detail')) initProductPage();
  });

  document.addEventListener('cartUpdated', () => {
    if (document.getElementById('cart-body')) renderCartPage();
  });
})();
