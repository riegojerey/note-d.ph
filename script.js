const navbar = document.getElementById('navbar');
const track = document.getElementById('carouselTrack');
const prevBtn = document.querySelector('.carousel-prev');
const nextBtn = document.querySelector('.carousel-next');
const filterBtns = document.querySelectorAll('.filter-btn');
const cards = document.querySelectorAll('.product-card');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

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
  el.setAttribute('title', 'Click to copy');
  el.addEventListener('click', async () => {
    const original = el.textContent;
    try {
      await navigator.clipboard.writeText(original);
      el.textContent = 'Copied!';
      el.style.color = 'var(--forest)';
      setTimeout(() => {
        el.textContent = original;
        el.style.color = '';
      }, 1500);
    } catch {
      el.textContent = 'Copy failed';
      setTimeout(() => {
        el.textContent = original;
      }, 1500);
    }
  });
});
