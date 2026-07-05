const navbar = document.getElementById('navbar');
const track = document.getElementById('carouselTrack');
const prevBtn = document.querySelector('.carousel-prev');
const nextBtn = document.querySelector('.carousel-next');
const dotsContainer = document.getElementById('carouselDots');
const filterBtns = document.querySelectorAll('.filter-btn');
const cards = document.querySelectorAll('.product-card');
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
const mobileLinks = mobileNav ? mobileNav.querySelectorAll('a') : [];

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

function toggleMenu() {
  hamburger.classList.toggle('active');
  mobileNav.classList.toggle('open');
  document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
}

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', toggleMenu);
  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (mobileNav.classList.contains('open')) toggleMenu();
    });
  });
}

let dotCards = [];

function rebuildDots() {
  if (!dotsContainer) return;
  dotsContainer.innerHTML = '';
  dotCards = Array.from(cards).filter((c) => !c.classList.contains('hidden'));
  dotCards.forEach((card, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Go to perfume ${i + 1}`);
    dot.addEventListener('click', () => {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    });
    dotsContainer.appendChild(dot);
  });
}

function updateDots() {
  if (!dotsContainer || !dotCards.length) return;
  const dots = dotsContainer.children;
  if (!dots.length) return;
  const trackRect = track.getBoundingClientRect();
  const center = trackRect.left + trackRect.width / 2;
  let closest = 0;
  let closestDist = Infinity;
  dotCards.forEach((card, i) => {
    const r = card.getBoundingClientRect();
    const dist = Math.abs(r.left + r.width / 2 - center);
    if (dist < closestDist) { closestDist = dist; closest = i; }
  });
  Array.from(dots).forEach((d, i) => d.classList.toggle('active', i === closest));
}

if (track && prevBtn && nextBtn) {
  const scrollAmount = 280;

  prevBtn.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });

  const updateArrows = () => {
    const atStart = track.scrollLeft <= 2;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    prevBtn.style.opacity = atStart ? '0.3' : '1';
    prevBtn.style.pointerEvents = atStart ? 'none' : 'auto';
    nextBtn.style.opacity = atEnd ? '0.3' : '1';
    nextBtn.style.pointerEvents = atEnd ? 'none' : 'auto';
  };

  track.addEventListener('scroll', updateArrows);
  window.addEventListener('resize', updateArrows);
  updateArrows();
}

if (track && dotsContainer) {
  rebuildDots();
  track.addEventListener('scroll', updateDots);
  updateDots();
}

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;

    cards.forEach((card) => {
      if (filter === 'all' || card.dataset.gender === filter) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });

    track.scrollTo({ left: 0, behavior: 'smooth' });

    if (dotsContainer) {
      setTimeout(() => { rebuildDots(); updateDots(); }, 200);
    }
  });
});

document.querySelectorAll('.btn-order').forEach((btn) => {
  btn.addEventListener('click', () => {
    btn.textContent = 'Opening Facebook...';
    btn.style.background = '#1877f2';
    btn.style.color = '#fff';
    btn.style.borderColor = '#1877f2';
    setTimeout(() => {
      btn.textContent = 'Order on Facebook';
      btn.style.background = 'transparent';
      btn.style.color = 'var(--earth)';
      btn.style.borderColor = 'var(--border)';
    }, 2000);
  });
});

document.querySelectorAll('.product-name').forEach((el) => {
  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.setAttribute('title', 'Copy name');
  btn.setAttribute('aria-label', 'Copy perfume name');
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  el.appendChild(btn);

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const original = el.childNodes[0].textContent.trim();
    try {
      await navigator.clipboard.writeText(original);
      el.style.color = 'var(--forest)';
      btn.style.color = 'var(--forest)';
      setTimeout(() => {
        el.style.color = '';
        btn.style.color = '';
      }, 1200);
    } catch {}
  });
});
