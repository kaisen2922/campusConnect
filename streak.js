/* ============================================
   STREAK.JS - Daily Login Streak System
   CampusConnect Premium Upgrade
   ============================================ */

'use strict';

/* ──────────────────────────────────────────
   1.  CORE STREAK LOGIC
   ────────────────────────────────────────── */
function initStreak(userId) {
  const user = AppState.users.find(u => u.id === userId);
  if (!user) return;

  const today     = new Date().toDateString();
  const storageKey = `cc_last_login_${userId}`;
  const lastLogin  = localStorage.getItem(storageKey);

  let streakChanged = false;
  let previousStreak = user.streak || 0;

  if (!lastLogin) {
    // First ever login
    user.streak = 1;
    streakChanged = true;
  } else if (lastLogin === today) {
    // Same day — nothing to change
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastLogin === yesterday.toDateString()) {
      // Consecutive day — increment
      user.streak = (user.streak || 0) + 1;
      streakChanged = true;
    } else {
      // Missed a day — reset
      if (user.streak > 1) {
        _showStreakBroken(user.streak);
      }
      user.streak = 1;
      streakChanged = true;
    }
  }

  // Save today as last login
  localStorage.setItem(storageKey, today);
  saveUsers();

  if (AppState.currentUser && AppState.currentUser.id === userId) {
    AppState.currentUser = { ...user };
  }

  if (streakChanged && user.streak > previousStreak) {
    _celebrateStreakMilestone(user.streak);
  }

  // Show daily warning if streak is healthy
  _showStreakWarning(user.streak);

  // Check streak badges
  if (typeof checkBadgesAnimated === 'function') {
    checkBadgesAnimated(user);
  } else {
    checkBadges(user);
  }

  // Update UI
  _updateStreakUI(user.streak);

  return user.streak;
}

/* ──────────────────────────────────────────
   2.  UI UPDATERS
   ────────────────────────────────────────── */
function _updateStreakUI(streak) {
  // Update topbar streak badge
  const streakBadge = document.querySelector('.streak-badge');
  if (streakBadge) {
    streakBadge.innerHTML = `🔥 ${streak} day${streak !== 1 ? 's' : ''}`;
    streakBadge.classList.add('streak-pop');
    setTimeout(() => streakBadge.classList.remove('streak-pop'), 600);
  }

  // Update dashboard stat card
  const statStreak = document.getElementById('statStreak');
  if (statStreak) animateCounter(statStreak, streak, 700);
}

/* ──────────────────────────────────────────
   3.  NOTIFICATIONS
   ────────────────────────────────────────── */
function _showStreakBroken(oldStreak) {
  showToast(
    '😢 Streak Broken!',
    `Your ${oldStreak}-day streak has reset. Start fresh today!`,
    'error',
    5000
  );
}

function _celebrateStreakMilestone(streak) {
  const milestones = { 3: '🔥 3-Day Streak!', 7: '⚔️ One Week!', 14: '🌟 Fortnight!', 30: '👑 30 Days Legend!' };
  const msg = milestones[streak];
  if (msg) {
    showToast(msg, `You've been active ${streak} days in a row. Keep it up!`, 'success', 4500);
    if (streak === 7 || streak === 30) triggerConfetti();
  } else if (streak > 1) {
    showToast('🔥 Streak Continued!', `Day ${streak} — Don't break your streak!`, 'info', 3000);
  }
}

function _showStreakWarning(streak) {
  if (streak < 3) return;

  // Show reminder once per session
  const sessionKey = 'cc_streak_warned_' + new Date().toDateString();
  if (sessionStorage.getItem(sessionKey)) return;
  sessionStorage.setItem(sessionKey, '1');

  setTimeout(() => {
    showToast(
      `🔥 ${streak}-Day Streak Active`,
      'Come back tomorrow to keep it going!',
      'warning',
      4000
    );
  }, 3000);
}

/* ──────────────────────────────────────────
   4.  STREAK CARD RENDERER
      (Inject into dashboard or profile)
   ────────────────────────────────────────── */
function renderStreakCard(userId) {
  const user = AppState.users.find(u => u.id === userId);
  if (!user) return '';

  const streak = user.streak || 0;
  const intensity = streak >= 30 ? 'legend' : streak >= 14 ? 'hot' : streak >= 7 ? 'warm' : streak >= 3 ? 'mild' : 'cold';

  // Build last 7 days activity dots
  const today = new Date();
  const dots = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const isToday = i === 0;
    // Approximate: mark as active if within streak window
    const active = (streak > i) || isToday;
    dots.push(`
      <div class="streak-dot ${active ? 'active' : ''} ${isToday ? 'today' : ''}" 
           title="${d.toLocaleDateString('en', { weekday: 'short' })}">
        ${isToday ? '🔥' : active ? '✓' : '·'}
      </div>
    `);
  }

  return `
    <div class="streak-card streak-${intensity}">
      <div class="streak-card-header">
        <span class="streak-fire">🔥</span>
        <span class="streak-count">${streak}</span>
        <span class="streak-label">Day Streak</span>
      </div>
      <div class="streak-dots">
        ${dots.join('')}
      </div>
      <div class="streak-footer">
        ${streak >= 7 ? `<span class="streak-badge-inline">⚔️ Week Warrior</span>` : ''}
        <span class="streak-msg">${_streakMessage(streak)}</span>
      </div>
    </div>
  `;
}

function _streakMessage(streak) {
  if (streak === 0) return "Log in every day to build your streak!";
  if (streak === 1) return "Great start! Come back tomorrow.";
  if (streak < 7)  return `Don't break your ${streak}-day streak!`;
  if (streak < 30) return `🔥 You're on fire! ${streak} days strong.`;
  return `👑 Legendary! ${streak} days and counting!`;
}

/* ──────────────────────────────────────────
   5.  EXPORTS
   ────────────────────────────────────────── */
window.initStreak       = initStreak;
window.renderStreakCard  = renderStreakCard;
