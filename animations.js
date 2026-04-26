/* ============================================
   ANIMATIONS.JS — Page Transitions, Micro-Interactions
   CampusConnect Premium Upgrade
   ============================================ */

'use strict';

/* ──────────────────────────────────────────
   1.  PAGE TRANSITION SYSTEM
   ────────────────────────────────────────── */
const PageTransition = (() => {
  let _isAnimating = false;

  function fadeOut(el, cb) {
    el.classList.add('page-exit');
    setTimeout(() => {
      el.classList.remove('page-exit');
      if (cb) cb();
    }, 280);
  }

  function fadeIn(el) {
    el.classList.add('page-enter');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.add('page-enter-active');
        setTimeout(() => {
          el.classList.remove('page-enter', 'page-enter-active');
        }, 400);
      });
    });
  }

  function transition(contentEl, renderFn) {
    if (_isAnimating) return;
    _isAnimating = true;

    fadeOut(contentEl, () => {
      renderFn();
      fadeIn(contentEl);
      _isAnimating = false;
    });
  }

  return { fadeIn, fadeOut, transition };
})();

/* ──────────────────────────────────────────
   2.  ENHANCED SKELETON LOADER
   ────────────────────────────────────────── */
function buildSkeletonHTML(type = 'dashboard') {
  const card = (h = 180) =>
    `<div class="skeleton-card"><div class="skeleton" style="height:${h}px;border-radius:16px"></div></div>`;

  if (type === 'dashboard') {
    return `
      <div class="skeleton-grid-4">
        ${Array(4).fill(card(110)).join('')}
      </div>
      <div class="skeleton-grid-2" style="margin-top:20px">
        ${Array(2).fill(card(200)).join('')}
      </div>
      <div class="skeleton-grid-3" style="margin-top:20px">
        ${Array(3).fill(card(160)).join('')}
      </div>
    `;
  }
  if (type === 'tasks') {
    return `
      <div class="skeleton-grid-3">
        ${Array(6).fill(card(180)).join('')}
      </div>
    `;
  }
  return `<div>${Array(3).fill(card()).join('')}</div>`;
}

/* ──────────────────────────────────────────
   3.  CARD TILT EFFECT (3-D hover)
   ────────────────────────────────────────── */
function initCardTilt(selector = '.stat-card') {
  document.querySelectorAll(selector).forEach(card => {
    if (card.dataset.tilt) return;
    card.dataset.tilt = '1';

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width  / 2;
      const cy = rect.height / 2;
      const rotX =  ((y - cy) / cy) * -6;
      const rotY =  ((x - cx) / cx) *  6;
      card.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
      card.style.boxShadow = `0 20px 40px rgba(108,99,255,0.2), 0 0 20px rgba(108,99,255,0.1)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease';
      card.style.transform  = '';
      card.style.boxShadow  = '';
      setTimeout(() => card.style.transition = '', 400);
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'none';
    });
  });
}

/* ──────────────────────────────────────────
   4.  STAGGER ENTRANCE ANIMATION
   ────────────────────────────────────────── */
function staggerEntrance(selector, delay = 60, baseDelay = 0) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el, i) => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'none';

    setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
      el.style.opacity    = '1';
      el.style.transform  = 'translateY(0)';
    }, baseDelay + i * delay);
  });
}

/* ──────────────────────────────────────────
   5.  NUMBER TICKER (enhanced)
   ────────────────────────────────────────── */
function tickCounter(el, from, to, duration = 900, prefix = '', suffix = '') {
  if (!el) return;
  const range     = to - from;
  const startTime = performance.now();

  const tick = (now) => {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased  = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(from + range * eased);
    el.textContent = prefix + current.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

/* ──────────────────────────────────────────
   6.  LEADERBOARD RANK CHANGE ANIMATOR
   ────────────────────────────────────────── */
let _prevLeaderboard = [];

function animateRankChanges(newLb) {
  newLb.forEach(user => {
    const prev = _prevLeaderboard.find(u => u.id === user.id);
    if (!prev) return;

    const rankDelta = prev.rank - user.rank;  // positive = moved up
    const rowEl = document.getElementById(`lb_row_${user.id}`);
    if (!rowEl || rankDelta === 0) return;

    rowEl.classList.add(rankDelta > 0 ? 'rank-up' : 'rank-down');
    setTimeout(() => rowEl.classList.remove('rank-up', 'rank-down'), 1200);

    // Notify current user about their own rank change
    if (user.id === AppState.currentUser?.id && rankDelta > 0) {
      showToast('🎉 Rank Up!', `You moved to Rank #${user.rank}`, 'success', 4000);
    }
  });

  _prevLeaderboard = newLb.map(u => ({ ...u }));
}

function setPrevLeaderboard(lb) {
  _prevLeaderboard = lb.map(u => ({ ...u }));
}

/* ──────────────────────────────────────────
   7.  PROGRESS BAR ANIMATE ON SCROLL
   ────────────────────────────────────────── */
function initProgressBarAnimations() {
  const bars = document.querySelectorAll('.progress-fill[data-width]');
  if (!bars.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        bar.style.width = bar.dataset.width + '%';
        io.unobserve(bar);
      }
    });
  }, { threshold: 0.3 });

  bars.forEach(bar => {
    bar.style.width = '0%';
    io.observe(bar);
  });
}

/* ──────────────────────────────────────────
   8.  NAV ACTIVE INDICATOR SLIDE
   ────────────────────────────────────────── */
function animateNavIndicator(targetPage) {
  const activeItem = document.querySelector(`.nav-item[data-page="${targetPage}"]`);
  if (!activeItem) return;

  const indicator = document.getElementById('navActiveIndicator') || (() => {
    const el = document.createElement('div');
    el.id = 'navActiveIndicator';
    el.className = 'nav-active-indicator';
    el.style.opacity = '0'; // Hide initially
    const nav = document.querySelector('.sidebar-nav');
    if (nav) {
      nav.appendChild(el);
      return el;
    }
    return null;
  })();

  if (!indicator) return;

  const rect   = activeItem.getBoundingClientRect();
  const parent = indicator.parentElement?.getBoundingClientRect();
  if (!parent) return;

  indicator.style.top     = `${rect.top - parent.top}px`;
  indicator.style.height  = `${rect.height}px`;
  indicator.style.opacity = '1'; // Show once positioned
}

/* ──────────────────────────────────────────
   9.  XP CHART (SPARKLINE — FAKE DATA)
   ────────────────────────────────────────── */
function renderXPSparkline(containerId, currentXP) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Generate plausible weekly XP history
  const weeks = 8;
  const data = [];
  let xp = Math.max(0, currentXP - (weeks * 200));
  for (let i = 0; i < weeks; i++) {
    xp += Math.floor(80 + Math.random() * 220);
    data.push(Math.min(xp, currentXP));
  }
  data[data.length - 1] = currentXP;

  const max   = Math.max(...data);
  const min   = Math.min(...data);
  const range = max - min || 1;
  const W     = 280;
  const H     = 80;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 10) - 5;
    return `${x},${y}`;
  });

  const linePath   = `M${pts.join(' L')}`;
  const areaPath   = `M${pts[0]} L${pts.join(' L')} L${W},${H} L0,${H} Z`;
  const lastPt     = pts[pts.length - 1].split(',');

  container.innerHTML = `
    <div class="xp-chart-wrap">
      <div class="xp-chart-label">XP Progress (8 weeks)</div>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="xp-sparkline">
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#6c63ff" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#6c63ff" stop-opacity="0"/>
          </linearGradient>
          <filter id="sparkGlow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <path d="${areaPath}" fill="url(#sparkGrad)"/>
        <path d="${linePath}" fill="none" stroke="#6c63ff" stroke-width="2.5"
              filter="url(#sparkGlow)" class="spark-line" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="${lastPt[0]}" cy="${lastPt[1]}" r="4" fill="#6c63ff"
                class="spark-dot" filter="url(#sparkGlow)"/>
        <text x="${lastPt[0]}" y="${parseFloat(lastPt[1]) - 8}"
              text-anchor="middle" font-size="9" fill="#ffd700" font-family="Space Mono,monospace">
          ${currentXP.toLocaleString()}
        </text>
      </svg>
      <div class="xp-chart-weeks">
        ${Array(weeks).fill(0).map((_, i) => `<span>W${i + 1}</span>`).join('')}
      </div>
    </div>
  `;

  // Animate the line draw
  const path = container.querySelector('.spark-line');
  if (path) {
    const len = path.getTotalLength?.() || 400;
    path.style.strokeDasharray  = len;
    path.style.strokeDashoffset = len;
    requestAnimationFrame(() => {
      path.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)';
      path.style.strokeDashoffset = '0';
    });
  }
}

/* ──────────────────────────────────────────
   10. MICRO-INTERACTION HELPERS
   ────────────────────────────────────────── */
function addClickRipple(el) {
  el.addEventListener('click', (e) => {
    if (window.AudioEngine) AudioEngine.click();
    
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${e.clientX - rect.left - size / 2}px;
      top:  ${e.clientY - rect.top  - size / 2}px;
    `;
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

function initMicroInteractions() {
  const attachRipples = (root = document) => {
    root.querySelectorAll('.btn:not([data-ripple])').forEach(btn => {
      btn.setAttribute('data-ripple', '1');
      addClickRipple(btn);
    });
  };

  attachRipples();

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => m.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        attachRipples(node.querySelectorAll ? node : document);
      }
    }));
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

/* ──────────────────────────────────────────
   11. INIT — call once on app load
   ────────────────────────────────────────── */
function initAnimations() {
  initMicroInteractions();

  // Re-init tilt + stagger after every navigation
  const origNavigateTo = window.navigateTo;
  if (origNavigateTo && !origNavigateTo._patched) {
    window.navigateTo = function(page) {
      origNavigateTo(page);
      animateNavIndicator(page);

      // After page renders (200ms skeleton delay + render time)
      setTimeout(() => {
        initCardTilt('.stat-card');
        staggerEntrance('.stat-card',   70, 0);
        staggerEntrance('.task-card',   55, 0);
        staggerEntrance('.card',        45, 0);
        initProgressBarAnimations();
      }, 350);
    };
    window.navigateTo._patched = true;
  }
}

/* ──────────────────────────────────────────
   EXPORTS
   ────────────────────────────────────────── */
window.PageTransition         = PageTransition;
window.buildSkeletonHTML      = buildSkeletonHTML;
window.initCardTilt           = initCardTilt;
window.staggerEntrance        = staggerEntrance;
window.tickCounter            = tickCounter;
window.animateRankChanges     = animateRankChanges;
window.setPrevLeaderboard     = setPrevLeaderboard;
window.initProgressBarAnimations = initProgressBarAnimations;
window.animateNavIndicator    = animateNavIndicator;
window.renderXPSparkline      = renderXPSparkline;
window.initMicroInteractions   = initMicroInteractions;
window.initAnimations         = initAnimations;
