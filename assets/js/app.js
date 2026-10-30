/**
 * app.js — WigglePrinted 3D Toys Store
 * Handles: product fetching, card generation, carousel, category grid,
 * cart (localStorage), accordion, quantity selector, thumbnail switcher.
 */

'use strict';

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const COLORS = {
  canvas:  '#0F172A',
  surface: '#1E293B',
  text:    '#F8FAFC',
  muted:   '#94A3B8',
  cyan:    '#06B6D4',
  coral:   '#F43F5E',
  mint:    '#10B981',
};

// ─── NO FALLBACK DATA — all products come from the CMS (data/products/*.json) ───

// ─── DATA FETCHING ──────────────────────────────────────────────────────────────

/**
 * Fetches all products. Reads data/products/index.json for slugs,
 * then fetches each individual JSON file.
 * Returns an empty array if the fetch fails — no hardcoded fallback.
 */
async function fetchProducts() {
  try {
    const indexRes = await fetch('data/products/index.json');
    if (!indexRes.ok) throw new Error('Index not found');
    const { products: slugs } = await indexRes.json();

    const results = await Promise.allSettled(
      slugs.map(slug =>
        fetch(`data/products/${slug}.json`).then(r => {
          if (!r.ok) throw new Error(`404: ${slug}`);
          return r.json();
        })
      )
    );

    const loaded = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    return loaded;
  } catch (err) {
    console.warn('[WigglePrinted] Could not load products from CMS.', err.message);
    return [];
  }
}

// Cache so we only fetch once per page load
let _productCache = null;
async function getProducts() {
  if (!_productCache) _productCache = await fetchProducts();
  return _productCache;
}

// ─── HTML HELPERS ───────────────────────────────────────────────────────────────

const ICONS = {
  bag: `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>`,
  heart: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>`,
  user: `<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
  cube: `<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`,
  placeholder: `<svg class="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`,
};

function renderBadges(badges = []) {
  if (!badges || !badges.length) return '';
  return badges.map(b => {
    const cls = b === 'Sale'
      ? 'bg-[#F43F5E] text-[#F8FAFC]'
      : b === 'Best Seller'
        ? 'bg-[#F43F5E]/90 text-[#F8FAFC]'
        : 'bg-[#06B6D4] text-[#F8FAFC]';
    return `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide ${cls}">${b}</span>`;
  }).join('');
}

function renderImageArea(product, heightClass = 'h-52') {
  if (product.featured_image) {
    return `<img src="${product.featured_image}" alt="${product.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">`;
  }
  // Colourful SVG placeholder based on category
  const catColors = {
    'Space Heroes':    { bg: '#0F172A', icon: '#06B6D4' },
    'Fantasy Knights': { bg: '#0F172A', icon: '#F43F5E' },
    'STEM Builders':   { bg: '#0F172A', icon: '#10B981' },
    'Speed Machines':  { bg: '#0F172A', icon: '#94A3B8' },
    'Action Figures':  { bg: '#0F172A', icon: '#F43F5E' },
    'Puzzles & Games': { bg: '#0F172A', icon: '#06B6D4' },
  };
  const c = catColors[product.category] || { bg: '#0F172A', icon: '#06B6D4' };
  return `
    <div class="w-full h-full flex flex-col items-center justify-center gap-3" style="background:${c.bg}">
      <div style="color:${c.icon}">${ICONS.placeholder}</div>
      <span class="text-[10px] font-medium tracking-widest uppercase" style="color:${c.icon}; opacity:0.5">${product.category || '3D Toy'}</span>
    </div>`;
}

/**
 * Generates a product card HTML string.
 * @param {Object} product
 * @param {'carousel'|'grid'} mode
 */
function generateProductCard(product, mode = 'grid') {
  const link = product.checkout_link || 'product.html';
  const heightClass = mode === 'carousel' ? 'h-48' : 'h-52';

  return `
<div class="relative bg-[#1E293B] rounded-2xl overflow-hidden border border-white/5 hover:border-[#06B6D4]/40 transition-all duration-300 hover:shadow-xl hover:shadow-[#06B6D4]/10 hover:-translate-y-0.5 group flex flex-col">
  <!-- Badges -->
  <div class="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
    ${renderBadges(product.badges)}
  </div>
  <!-- Wishlist button -->
  <button
    class="wishlist-btn absolute top-3 right-3 z-10 w-8 h-8 rounded-lg bg-[#0F172A]/70 backdrop-blur-sm flex items-center justify-center text-[#94A3B8] hover:text-[#F43F5E] transition-colors"
    aria-label="Add to wishlist"
    data-slug="${product.slug}">
    ${ICONS.heart}
  </button>
  <!-- Image -->
  <a href="${link}" class="${heightClass} block overflow-hidden flex-shrink-0">
    ${renderImageArea(product, heightClass)}
  </a>
  <!-- Card body -->
  <div class="p-4 flex flex-col flex-1">
    <!-- Specs row -->
    <div class="flex items-center gap-3 mb-2.5">
      ${product.specs?.age ? `
      <span class="flex items-center gap-1 text-[#94A3B8] text-[11px]">
        ${ICONS.user} Age ${product.specs.age}
      </span>` : ''}
      ${product.specs?.pieces ? `
      <span class="flex items-center gap-1 text-[#94A3B8] text-[11px]">
        ${ICONS.cube} ${product.specs.pieces} pcs
      </span>` : ''}
    </div>
    <!-- Title -->
    <a href="${link}" class="text-[#F8FAFC] text-sm font-semibold leading-snug hover:text-[#06B6D4] transition-colors line-clamp-2 mb-auto">
      ${product.title}
    </a>
    <!-- Price + CTA -->
    <div class="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
      <span class="text-[#06B6D4] text-lg font-bold">\$${Number(product.price).toFixed(2)}</span>
      <button
        class="add-to-bag-btn flex items-center gap-1.5 bg-[#06B6D4] hover:bg-[#0891B2] active:scale-95 text-[#F8FAFC] text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-150"
        data-slug="${product.slug}"
        data-title="${product.title}"
        data-price="${product.price}">
        ${ICONS.bag} Add to Bag
      </button>
    </div>
  </div>
</div>`.trim();
}

// ─── HOME CAROUSEL ──────────────────────────────────────────────────────────────

async function initHomeCarousel() {
  const track = document.getElementById('carousel-track');
  if (!track) return;

  track.innerHTML = `<div class="flex gap-4 px-1 py-2">
    ${[1,2,3,4].map(() => skeletonCard()).join('')}
  </div>`;

  const products = await getProducts();

  track.innerHTML = `<div class="flex gap-5 px-1 py-2">
    ${products.map(p => `
      <div class="flex-shrink-0 w-60 sm:w-64">
        ${generateProductCard(p, 'carousel')}
      </div>`).join('')}
  </div>`;
}

function skeletonCard() {
  return `
    <div class="flex-shrink-0 w-64 bg-[#1E293B] rounded-2xl overflow-hidden animate-pulse">
      <div class="h-48 bg-[#0F172A]"></div>
      <div class="p-4 space-y-3">
        <div class="h-3 bg-[#0F172A] rounded w-3/4"></div>
        <div class="h-3 bg-[#0F172A] rounded w-1/2"></div>
        <div class="h-8 bg-[#0F172A] rounded w-full mt-2"></div>
      </div>
    </div>`;
}

// ─── CATEGORY GRID ──────────────────────────────────────────────────────────────

async function initCategoryGrid() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const products = await getProducts();

  // Skip index 0 — the hero card handles it separately
  const gridProducts = products.slice(1);

  grid.innerHTML = gridProducts.map(p => generateProductCard(p, 'grid')).join('');

  // Wire up hero card data
  const heroTitle = document.getElementById('hero-product-title');
  const heroPrice = document.getElementById('hero-product-price');
  const heroBtn   = document.getElementById('hero-add-to-bag');
  if (products[0]) {
    if (heroTitle) heroTitle.textContent = products[0].title;
    if (heroPrice) heroPrice.textContent = `\$${Number(products[0].price).toFixed(2)}`;
    if (heroBtn) {
      heroBtn.dataset.slug  = products[0].slug;
      heroBtn.dataset.title = products[0].title;
      heroBtn.dataset.price = products[0].price;
    }
  }
}

// ─── CAROUSEL NAVIGATION ────────────────────────────────────────────────────────

function initCarouselNav() {
  const track   = document.getElementById('carousel-track');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  if (!track) return;

  const SCROLL = 290;
  prevBtn?.addEventListener('click', () => track.scrollBy({ left: -SCROLL, behavior: 'smooth' }));
  nextBtn?.addEventListener('click', () => track.scrollBy({ left:  SCROLL, behavior: 'smooth' }));
}

// ─── CATEGORY TABS ──────────────────────────────────────────────────────────────

async function initCategoryTabs() {
  const tabs = document.querySelectorAll('[data-tab]');
  if (!tabs.length) return;

  const allProducts = await getProducts();

  tabs.forEach(tab => {
    tab.addEventListener('click', async () => {
      // Visual state
      tabs.forEach(t => {
        t.classList.remove('bg-[#06B6D4]', 'text-[#F8FAFC]', 'shadow-lg', 'shadow-[#06B6D4]/20');
        t.classList.add('bg-[#1E293B]', 'text-[#94A3B8]');
      });
      tab.classList.add('bg-[#06B6D4]', 'text-[#F8FAFC]', 'shadow-lg', 'shadow-[#06B6D4]/20');
      tab.classList.remove('bg-[#1E293B]', 'text-[#94A3B8]');

      const category = tab.dataset.tab;
      const track = document.getElementById('carousel-track');
      if (!track) return;

      const filtered = category === 'All'
        ? allProducts
        : allProducts.filter(p => p.category === category || p.badges?.includes(category));

      const inner = track.querySelector('div') || track;
      inner.innerHTML = (filtered.length ? filtered : allProducts).map(p => `
        <div class="flex-shrink-0 w-60 sm:w-64">
          ${generateProductCard(p, 'carousel')}
        </div>`).join('');
    });
  });
}

// ─── CART ───────────────────────────────────────────────────────────────────────

let _cart = [];
try { _cart = JSON.parse(localStorage.getItem('pp_cart') || '[]'); } catch {}

function saveCart() {
  try { localStorage.setItem('pp_cart', JSON.stringify(_cart)); } catch {}
}

function getCartTotal() {
  return _cart.reduce((s, i) => s + i.qty, 0);
}

function updateCartBadges() {
  const count = getCartTotal();
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function addToCart(slug, title, price) {
  const existing = _cart.find(i => i.slug === slug);
  if (existing) {
    existing.qty++;
  } else {
    _cart.push({ slug, title, price: parseFloat(price) || 0, qty: 1 });
  }
  saveCart();
  updateCartBadges();
  showToast(`Added <strong>${title}</strong> to your bag!`);
}

// ─── TOAST ──────────────────────────────────────────────────────────────────────

function showToast(html, type = 'success') {
  const icon = type === 'success'
    ? `<svg class="w-4 h-4 text-[#10B981] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`
    : `<svg class="w-4 h-4 text-[#F43F5E] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>`;

  const toast = document.createElement('div');
  toast.className = [
    'fixed bottom-6 right-6 z-[9999]',
    'bg-[#1E293B] border border-white/10',
    'text-[#F8FAFC] text-sm px-4 py-3 rounded-xl',
    'shadow-2xl shadow-black/40',
    'flex items-center gap-3',
    'translate-y-4 opacity-0 transition-all duration-300',
    'max-w-xs',
  ].join(' ');
  toast.innerHTML = `${icon}<span>${html}</span>`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    });
  });

  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 2800);
}

// ─── ACCORDION ──────────────────────────────────────────────────────────────────

function initAccordions() {
  document.querySelectorAll('[data-accordion-trigger]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const panelId = trigger.dataset.accordionTrigger;
      const panel   = document.getElementById(panelId);
      const icon    = trigger.querySelector('[data-accordion-icon]');
      if (!panel) return;

      const isOpen = !panel.classList.contains('hidden');
      // Close all others
      document.querySelectorAll('[data-accordion-trigger]').forEach(t => {
        const pId = t.dataset.accordionTrigger;
        const p   = document.getElementById(pId);
        const ic  = t.querySelector('[data-accordion-icon]');
        if (p && !p.classList.contains('hidden')) {
          p.classList.add('hidden');
          if (ic) ic.classList.remove('rotate-180');
        }
      });

      if (!isOpen) {
        panel.classList.remove('hidden');
        if (icon) icon.classList.add('rotate-180');
      }
    });
  });
}

// ─── QUANTITY SELECTOR ──────────────────────────────────────────────────────────

function initQuantitySelector() {
  const dec   = document.getElementById('qty-dec');
  const inc   = document.getElementById('qty-inc');
  const input = document.getElementById('qty-input');
  if (!dec || !inc || !input) return;

  dec.addEventListener('click', () => {
    const v = parseInt(input.value, 10);
    if (v > 1) input.value = v - 1;
  });
  inc.addEventListener('click', () => {
    const v = parseInt(input.value, 10);
    if (v < 99) input.value = v + 1;
  });
  input.addEventListener('change', () => {
    let v = parseInt(input.value, 10);
    if (isNaN(v) || v < 1) v = 1;
    if (v > 99) v = 99;
    input.value = v;
  });
}

// ─── THUMBNAIL SWITCHER ─────────────────────────────────────────────────────────

function initThumbnails() {
  const thumbs    = document.querySelectorAll('[data-thumbnail]');
  const mainImage = document.getElementById('main-product-image');
  if (!thumbs.length || !mainImage) return;

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => {
        t.classList.remove('border-[#06B6D4]', 'shadow-[#06B6D4]/30');
        t.classList.add('border-white/10');
      });
      thumb.classList.add('border-[#06B6D4]', 'shadow-[#06B6D4]/30');
      thumb.classList.remove('border-white/10');
      // Animate the main image swap
      mainImage.classList.add('opacity-0', 'scale-95');
      setTimeout(() => {
        mainImage.classList.remove('opacity-0', 'scale-95');
      }, 180);
    });
  });
}

// ─── MOBILE MENU ────────────────────────────────────────────────────────────────

function initMobileMenu() {
  const btn  = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('hidden');
    btn.setAttribute('aria-expanded', String(!open));
  });
}

// ─── EVENT DELEGATION ───────────────────────────────────────────────────────────

document.addEventListener('click', e => {
  // Add to Bag
  const bagBtn = e.target.closest('.add-to-bag-btn');
  if (bagBtn) {
    const { slug, title, price } = bagBtn.dataset;
    addToCart(slug || 'unknown', title || 'Product', price || 0);
    bagBtn.classList.add('scale-95');
    setTimeout(() => bagBtn.classList.remove('scale-95'), 150);
  }

  // Wishlist
  const wlBtn = e.target.closest('.wishlist-btn');
  if (wlBtn) {
    const isActive = wlBtn.classList.toggle('text-[#F43F5E]');
    wlBtn.classList.toggle('text-[#94A3B8]', !isActive);
    showToast(isActive ? 'Added to wishlist!' : 'Removed from wishlist.', isActive ? 'success' : 'info');
  }
});

// ─── MAIN INIT ──────────────────────────────────────────────────────────────────

/**
 * Renders a full-page product grid into a container element.
 * Shows a "no products" message if the filtered list is empty.
 * @param {HTMLElement} container
 * @param {Object[]} products
 */
function renderProductGrid(container, products) {
  if (!products.length) {
    container.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-24 gap-4 text-center">
        <svg class="w-14 h-14 text-[#94A3B8]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
        <p class="text-[#94A3B8] text-sm">No products found. Check back soon!</p>
      </div>`;
    return;
  }
  container.innerHTML = products.map(p => generateProductCard(p, 'grid')).join('');
}

async function initBestSellersGrid() {
  const grid = document.getElementById('best-sellers-grid');
  if (!grid) return;
  const products = await getProducts();
  // Best sellers = products with 'Best Seller' badge
  const bestSellers = products.filter(p => p.badges?.includes('Best Seller'));
  // If none are tagged, show all products rather than an empty page
  renderProductGrid(grid, bestSellers.length ? bestSellers : products);
}

async function initNewArrivalsGrid() {
  const grid = document.getElementById('new-arrivals-grid');
  if (!grid) return;
  const products = await getProducts();
  // New arrivals = products with 'New' badge
  const newArrivals = products.filter(p => p.badges?.includes('New'));
  renderProductGrid(grid, newArrivals.length ? newArrivals : products);
}

// ─── MAIN INIT ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  updateCartBadges();

  // Home page
  if (document.getElementById('carousel-track')) {
    initHomeCarousel();
    initCarouselNav();
    initCategoryTabs();
  }

  // Category page
  if (document.getElementById('product-grid')) {
    initCategoryGrid();
  }

  // Product detail page
  if (document.getElementById('main-product-image')) {
    initThumbnails();
    initQuantitySelector();
  }

  // Best sellers page
  if (document.getElementById('best-sellers-grid')) {
    initBestSellersGrid();
  }

  // New arrivals page
  if (document.getElementById('new-arrivals-grid')) {
    initNewArrivalsGrid();
  }

  // All pages
  initAccordions();
});
