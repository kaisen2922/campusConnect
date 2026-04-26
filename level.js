/* ============================================
   LEVEL.JS - Level Progression & Badges
   CampusConnect Premium Upgrade
   ============================================ */

'use strict';

/* ──────────────────────────────────────────
   1.  BADGE UNLOCK ANIMATION
   ────────────────────────────────────────── */
function showBadgeUnlock(badge) {
  const wrap = document.createElement('div');
  wrap.className = 'badge-unlock-popup';
  wrap.innerHTML = `
    <div class="bup-glow"></div>
    <div class="bup-icon">${badge.icon}</div>
    <div class="bup-label">Badge Unlocked!</div>
    <div class="bup-name">${badge.name}</div>
    <div class="bup-desc">${badge.desc}</div>
  `;
  document.body.appendChild(wrap);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => wrap.classList.add('show'));
  });

  if (typeof triggerConfetti === 'function') {
    triggerConfetti();
  }
  if (window.AudioEngine) AudioEngine.levelUp();

  setTimeout(() => {
    wrap.classList.add('hide');
    setTimeout(() => wrap.remove(), 600);
  }, 3500);
}

/* ──────────────────────────────────────────
   2.  ENHANCED checkBadges (with popup)
   ────────────────────────────────────────── */
function checkBadgesAnimated(user) {
  const toEarn = [];

  if (user.completedTasks >= 1  && !user.badges.includes('first_task')) toEarn.push('first_task');
  if (user.completedTasks >= 5  && !user.badges.includes('tasks_5'))   toEarn.push('tasks_5');
  if (user.completedTasks >= 10 && !user.badges.includes('tasks_10'))  toEarn.push('tasks_10');
  if (user.xp >= 500  && !user.badges.includes('xp_500'))  toEarn.push('xp_500');
  if (user.xp >= 1000 && !user.badges.includes('xp_1000')) toEarn.push('xp_1000');
  if (user.streak >= 3 && !user.badges.includes('streak_3')) toEarn.push('streak_3');
  if (user.streak >= 7 && !user.badges.includes('streak_7')) toEarn.push('streak_7');

  const sorted = [...AppState.users].sort((a, b) => b.xp - a.xp);
  const rank = sorted.findIndex(u => u.id === user.id) + 1;
  if (rank <= 3 && !user.badges.includes('top3')) toEarn.push('top3');
  if (getLevel(user.xp).name === 'Legend' && !user.badges.includes('legend')) toEarn.push('legend');

  toEarn.forEach((badgeId, i) => {
    user.badges.push(badgeId);
    const badge = BADGES_DEF.find(b => b.id === badgeId);
    if (badge) {
      setTimeout(() => showBadgeUnlock(badge), i * 1800);
    }
  });
}

/* ──────────────────────────────────────────
   3.  SMART RECOMMENDATION ENGINE
   ────────────────────────────────────────── */
function getSmartRecommendedTask() {
  const user = AppState.currentUser;
  if (!user) return null;

  const userSubs  = getUserSubmissions(user.id);
  const submittedIds = userSubs.map(s => s.taskId);
  const available = AppState.tasks.filter(t => !submittedIds.includes(t.id));
  if (available.length === 0) return null;

  const level = getLevel(user.xp);

  // Scoring: match difficulty to level + bonus for high XP
  const diffScore = { Easy: 1, Medium: 2, Hard: 3, Expert: 4 };
  const idealScore = level.index + 1;   // Rookie→1, Dev→2, SeniorDev→3, Arch→4, Legend→4

  return available
    .map(task => {
      const d = diffScore[task.difficulty] || 2;
      const diff = Math.abs(d - idealScore);
      // Score: closer difficulty = higher, more XP = bonus
      return { task, score: (10 - diff * 3) + task.xp * 0.01 };
    })
    .sort((a, b) => b.score - a.score)[0].task;
}

/* ──────────────────────────────────────────
   EXPORTS
   ────────────────────────────────────────── */
window.showBadgeUnlock         = showBadgeUnlock;
window.checkBadgesAnimated     = checkBadgesAnimated;
window.getSmartRecommendedTask = getSmartRecommendedTask;
