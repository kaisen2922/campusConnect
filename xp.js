/* ============================================
   XP.JS - XP Tracking & Visual Feedback
   CampusConnect Premium Upgrade
   ============================================ */

'use strict';

/* ──────────────────────────────────────────
   1.  FLOATING "+XP" POPUP
   ────────────────────────────────────────── */
function showXPFloat(amount, anchorEl) {
  const popup = document.createElement('div');
  popup.className = 'xp-float-popup';
  popup.textContent = `+${amount} XP`;

  // Position near the anchor element if provided
  if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    popup.style.left = `${rect.left + rect.width / 2}px`;
    popup.style.top  = `${rect.top + window.scrollY}px`;
  } else {
    popup.style.left = '50%';
    popup.style.top  = '45%';
    popup.style.transform = 'translateX(-50%)';
  }

  document.body.appendChild(popup);

  // Trigger float animation after paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => popup.classList.add('fly'));
  });

  setTimeout(() => popup.remove(), 1400);
}

/* ──────────────────────────────────────────
   2.  ANIMATED XP BAR UPDATE
   ────────────────────────────────────────── */
function animateXPGain(userId, amount, triggerEl) {
  // Show popup immediately
  showXPFloat(amount, triggerEl);

  const userIdx = AppState.users.findIndex(u => u.id === userId);
  if (userIdx === -1) return;

  const user = AppState.users[userIdx];
  const prevXP = user.xp - amount;          // already incremented by addXP()

  // Animate sidebar XP counter
  const xpValEl = document.getElementById('sidebarXPVal');
  if (xpValEl) {
    if (typeof animateCounter === 'function') {
      animateCounter(xpValEl, user.xp, 900);
    } else if (typeof tickCounter === 'function') {
      tickCounter(xpValEl, prevXP, user.xp, 900);
    } else {
      xpValEl.textContent = user.xp.toLocaleString();
    }
  }

  // Animate sidebar XP bar
  const xpBarEl = document.getElementById('sidebarXPBar');
  if (xpBarEl) {
    // flash
    xpBarEl.classList.add('xp-bar-flash');
    setTimeout(() => xpBarEl.classList.remove('xp-bar-flash'), 700);

    const target = getXpProgress(user.xp);
    // Start from previous value
    const prev = getXpProgress(prevXP);
    xpBarEl.style.width = prev + '%';
    setTimeout(() => {
      xpBarEl.style.transition = 'width 1s cubic-bezier(0.4,0,0.2,1)';
      xpBarEl.style.width = target + '%';
    }, 100);
  }

  // Animate dashboard stat if visible
  const statXPEl = document.getElementById('statXP');
  if (statXPEl) {
    if (typeof animateCounter === 'function') {
      animateCounter(statXPEl, user.xp, 900);
    } else if (typeof tickCounter === 'function') {
      tickCounter(statXPEl, prevXP, user.xp, 900);
    } else {
      statXPEl.textContent = user.xp.toLocaleString();
    }
  }
}

/* ──────────────────────────────────────────
   3.  ENHANCED addXP — wires animations in
   ────────────────────────────────────────── */
function addXPAnimated(userId, amount, reason, triggerEl) {
  const userIdx = AppState.users.findIndex(u => u.id === userId);
  if (userIdx === -1) return;

  const oldLevel = getLevel(AppState.users[userIdx].xp);

  // Use core addXP (already handles saves)
  addXP(userId, amount, reason);

  const newLevel = getLevel(AppState.users[userIdx].xp);

  // Trigger visual XP animation
  animateXPGain(userId, amount, triggerEl);
  if (window.AudioEngine) AudioEngine.xp();

  // Toast for XP gain
  showToast('⚡ XP Earned!', `+${amount} XP — ${reason}`, 'xp', 3000);

  // Trigger Level Up specific animations
  if (newLevel.index > oldLevel.index) {
    if (typeof triggerConfetti === 'function') triggerConfetti();
    if (window.AudioEngine) AudioEngine.levelUp();
    showToast('🎉 LEVEL UP!', `You are now a ${newLevel.name}!`, 'success', 6000);
  }
}

/* ──────────────────────────────────────────
   EXPORTS
   ────────────────────────────────────────── */
window.showXPFloat   = showXPFloat;
window.animateXPGain = animateXPGain;
window.addXPAnimated = addXPAnimated;
