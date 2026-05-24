/* =============================================
   SANJEEVNI TECHNO — script.js
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ============================================
     SKELETON LOADER
     ============================================ */
  const skeleton = document.getElementById('skeleton-overlay');
  window.addEventListener('load', () => {
    setTimeout(() => {
      skeleton.classList.add('hidden');
      initRevealAnimations();
      revealHero();
    }, 600);
  });
  // Fallback in case load fires before DOMContentLoaded finishes
  if (document.readyState === 'complete') {
    setTimeout(() => {
      skeleton.classList.add('hidden');
      initRevealAnimations();
      revealHero();
    }, 400);
  }

  /* ============================================
     NAVBAR
     ============================================ */
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const navCloseBtn = document.getElementById('navCloseBtn');
  const allNavLinks = document.querySelectorAll('.nav-link');

  // Helper: close mobile menu
  function closeMobileMenu() {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Scroll handling
  const handleScroll = () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    updateActiveNav();
  };
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // In-drawer close button
  if (navCloseBtn) {
    navCloseBtn.addEventListener('click', closeMobileMenu);
  }

  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('open') && !navbar.contains(e.target)) {
      closeMobileMenu();
    }
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      closeMobileMenu();
    }
  });

  // Active nav link based on scroll position
  const sections = document.querySelectorAll('section[id]');
  function updateActiveNav() {
    const scrollPos = window.scrollY + 100;
    sections.forEach(section => {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      const id = section.getAttribute('id');
      const link = document.querySelector(`.nav-link[href="#${id}"]`);
      if (link) {
        if (scrollPos >= top && scrollPos < bottom) {
          allNavLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      }
    });
  }

  /* ============================================
     REVEAL ANIMATIONS — Hero
     ============================================ */
  function revealHero() {
    const heroEls = document.querySelectorAll('#hero .reveal-fade, #hero .reveal-up');
    heroEls.forEach((el, i) => {
      setTimeout(() => el.classList.add('revealed'), i * 180);
    });
  }

  /* ============================================
     REVEAL ANIMATIONS — Intersection Observer
     ============================================ */
  function initRevealAnimations() {
    const revealEls = document.querySelectorAll(
      '.reveal-fade:not(#hero *), .reveal-up:not(#hero *), .reveal-left, .reveal-right'
    );

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.delay ? parseInt(el.dataset.delay) : 0;
          setTimeout(() => el.classList.add('revealed'), delay);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));
  }

  /* ============================================
     STATS COUNTER ANIMATION
     ============================================ */
  const statNums = document.querySelectorAll('.stat-num');
  let countersStarted = false;

  function animateCounter(el) {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current);
    }, 16);
  }

  const statsSection = document.getElementById('stats');
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !countersStarted) {
        countersStarted = true;
        statNums.forEach(el => animateCounter(el));
      }
    });
  }, { threshold: 0.3 });

  if (statsSection) statsObserver.observe(statsSection);

  /* ============================================
     TESTIMONIALS CAROUSEL
     ============================================ */
  const track = document.getElementById('testiTrack');
  const slides = track ? track.querySelectorAll('.testi-slide') : [];
  const dotsContainer = document.getElementById('testiDots');
  const prevBtn = document.getElementById('testiPrev');
  const nextBtn = document.getElementById('testiNext');
  let currentSlide = 0;
  let autoplayTimer;

  if (slides.length > 0 && dotsContainer) {
    // Create dots
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = `testi-dot${i === 0 ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    });

    function goToSlide(index) {
      currentSlide = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
      dotsContainer.querySelectorAll('.testi-dot').forEach((d, i) => {
        d.classList.toggle('active', i === currentSlide);
      });
      resetAutoplay();
    }

    function nextSlide() { goToSlide(currentSlide + 1); }
    function prevSlide() { goToSlide(currentSlide - 1); }

    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    // Touch/swipe
    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) diff > 0 ? nextSlide() : prevSlide();
    });

    function startAutoplay() {
      autoplayTimer = setInterval(nextSlide, 4500);
    }
    function resetAutoplay() {
      clearInterval(autoplayTimer);
      startAutoplay();
    }

    startAutoplay();
  }

  /* ============================================
     RIPPLE EFFECT
     ============================================ */
  document.querySelectorAll('.ripple').forEach(el => {
    el.addEventListener('click', function(e) {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height);
      const wave = document.createElement('span');
      wave.className = 'ripple-wave';
      wave.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${x - size / 2}px;
        top: ${y - size / 2}px;
      `;
      el.appendChild(wave);
      wave.addEventListener('animationend', () => wave.remove());
    });
  });

  /* ============================================
     SMOOTH SCROLLING (enhanced)
     ============================================ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navHeight = navbar.offsetHeight;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ============================================
     LAZY LOADING (native + fallback)
     ============================================ */
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading supported
  } else {
    const lazyImgs = document.querySelectorAll('img[loading="lazy"]');
    const lazyObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) img.src = img.dataset.src;
          lazyObserver.unobserve(img);
        }
      });
    });
    lazyImgs.forEach(img => lazyObserver.observe(img));
  }

  /* ============================================
     PARALLAX — Subtle hero blobs
     ============================================ */
  const blobs = document.querySelectorAll('.blob');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        blobs.forEach((blob, i) => {
          const speed = 0.1 + (i * 0.05);
          blob.style.transform = `translateY(${scrolled * speed}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  /* ============================================
     SOL CARD STAGGER
     ============================================ */
  const solCards = document.querySelectorAll('.sol-card');
  const solObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || 0);
        setTimeout(() => entry.target.classList.add('revealed'), delay);
        solObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  solCards.forEach(card => solObserver.observe(card));

  /* ============================================
     TEAM CARD STAGGER
     ============================================ */
  const teamCards = document.querySelectorAll('.team-card');
  const teamObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || 0);
        setTimeout(() => entry.target.classList.add('revealed'), delay);
        teamObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  teamCards.forEach(card => teamObserver.observe(card));

  /* ============================================
     PORT CARD STAGGER
     ============================================ */
  const portCards = document.querySelectorAll('.port-card');
  const portObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || 0);
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, delay);
        portObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  portCards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(24px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    portObserver.observe(card);
  });

  /* ============================================
     DASHBOARD CARD — Live counter animation
     ============================================ */
  const dashVals = document.querySelectorAll('.ds-val');
  const dashTargets = [99.8, 2.4, 128];
  const dashUnits = ['%', 'ms', '%'];
  const dashPrefixes = ['', '', '+'];
  let dashAnimated = false;

  const dashObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !dashAnimated) {
        dashAnimated = true;
        dashVals.forEach((el, i) => {
          const prefix = dashPrefixes[i];
          const end = dashTargets[i];
          const unit = dashUnits[i];
          let current = 0;
          const duration = 1800;
          const steps = duration / 16;
          const step = end / steps;
          const timer = setInterval(() => {
            current += step;
            if (current >= end) { current = end; clearInterval(timer); }
            el.textContent = prefix + (Math.round(current * 10) / 10) + unit;
          }, 16);
        });
      }
    });
  }, { threshold: 0.5 });

  const dashCard = document.querySelector('.dashboard-card');
  if (dashCard) dashObserver.observe(dashCard);

  // Init scroll-triggered nav on first load
  handleScroll();
});