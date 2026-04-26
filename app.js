/* ============================================
   APP.JS - Core Data, State & Utilities
   ============================================ */

// ============ DATA SCHEMA ============
const LEVELS = [
  { name: 'Rookie', icon: '🌱', min: 0, max: 500, color: '#94a3b8' },
  { name: 'Developer', icon: '💻', min: 500, max: 1500, color: '#00d4ff' },
  { name: 'Senior Dev', icon: '⚡', min: 1500, max: 3000, color: '#6c63ff' },
  { name: 'Architect', icon: '🏗️', min: 3000, max: 6000, color: '#ff6b35' },
  { name: 'Legend', icon: '👑', min: 6000, max: Infinity, color: '#ffd700' }
];

const BADGES_DEF = [
  { id: 'first_task', name: 'First Step', icon: '🎯', desc: 'Complete your first task' },
  { id: 'streak_3', name: '3-Day Streak', icon: '🔥', desc: 'Login 3 days in a row' },
  { id: 'streak_7', name: 'Week Warrior', icon: '⚔️', desc: 'Login 7 days in a row' },
  { id: 'xp_500', name: 'XP Hunter', icon: '💰', desc: 'Earn 500 XP total' },
  { id: 'xp_1000', name: 'XP Master', icon: '🏆', desc: 'Earn 1000 XP total' },
  { id: 'tasks_5', name: 'Task Ninja', icon: '🥷', desc: 'Complete 5 tasks' },
  { id: 'tasks_10', name: 'Overachiever', icon: '🌟', desc: 'Complete 10 tasks' },
  { id: 'top3', name: 'Podium Finish', icon: '🥇', desc: 'Reach top 3 on leaderboard' },
  { id: 'legend', name: 'Legend', icon: '👑', desc: 'Reach Legend level' },
];

const DUMMY_TASKS = [
  {
    id: 'task_1',
    title: 'Promote Event on LinkedIn',
    description: 'Share the upcoming hackathon on your LinkedIn profile with a custom post. Tag the college page and use hashtags.',
    xp: 80,
    deadline: '2025-09-30',
    category: 'Social Media',
    difficulty: 'Easy',
    createdBy: 'admin',
    status: 'active'
  },
  {
    id: 'task_2',
    title: 'Recruit 5 New Members',
    description: 'Bring in at least 5 new students to sign up for the CampusConnect platform. Submit their usernames as proof.',
    xp: 200,
    deadline: '2025-10-05',
    category: 'Recruitment',
    difficulty: 'Hard',
    createdBy: 'admin',
    status: 'active'
  },
  {
    id: 'task_3',
    title: 'Write a Blog Post',
    description: 'Write a 500+ word blog post about your experience as a campus ambassador. Publish on Medium or your own blog.',
    xp: 120,
    deadline: '2025-10-10',
    category: 'Content',
    difficulty: 'Medium',
    createdBy: 'admin',
    status: 'active'
  },
  {
    id: 'task_4',
    title: 'Instagram Story Campaign',
    description: 'Post 3 Instagram stories over 3 consecutive days promoting the campus events. Must include swipe-up link.',
    xp: 90,
    deadline: '2025-09-28',
    category: 'Social Media',
    difficulty: 'Easy',
    createdBy: 'admin',
    status: 'active'
  },
  {
    id: 'task_5',
    title: 'Host a Workshop',
    description: 'Organize and host a mini-workshop (online or offline) on any tech topic for fellow students. Minimum 10 attendees.',
    xp: 350,
    deadline: '2025-10-20',
    category: 'Events',
    difficulty: 'Expert',
    createdBy: 'admin',
    status: 'active'
  },
  {
    id: 'task_6',
    title: 'Create a Tutorial Video',
    description: 'Record a 3-minute tutorial video explaining a concept in your field. Upload to YouTube and share the link.',
    xp: 150,
    deadline: '2025-10-15',
    category: 'Content',
    difficulty: 'Medium',
    createdBy: 'admin',
    status: 'active'
  }
];

const DUMMY_USERS = [
  { id: 'u1', name: 'Joydip Acharjee', email: 'joydip@campus.edu', role: 'ambassador', xp: 1850, streak: 12, completedTasks: 9, badges: ['first_task','xp_500','tasks_5'], submissions: [] },
  { id: 'u2', name: 'Priya Sharma', email: 'priya@campus.edu', role: 'ambassador', xp: 3200, streak: 21, completedTasks: 14, badges: ['first_task','xp_500','xp_1000','tasks_5','tasks_10','streak_3','streak_7'], submissions: [] },
  { id: 'u3', name: 'Mahir Ahmad', email: 'mahir@campus.edu', role: 'ambassador', xp: 980, streak: 5, completedTasks: 4, badges: ['first_task','xp_500'], submissions: [] },
  { id: 'u4', name: 'Anshika Das', email: 'anshika@campus.edu', role: 'ambassador', xp: 2400, streak: 8, completedTasks: 11, badges: ['first_task','xp_500','xp_1000','tasks_5','tasks_10'], submissions: [] },
  { id: 'u5', name: 'Rohit Shaw', email: 'rohit@campus.edu', role: 'ambassador', xp: 650, streak: 3, completedTasks: 3, badges: ['first_task','streak_3'], submissions: [] },
  { id: 'u6', name: 'Shreya Gupta', email: 'shreya@campus.edu', role: 'ambassador', xp: 4100, streak: 30, completedTasks: 18, badges: ['first_task','xp_500','xp_1000','tasks_5','tasks_10','streak_3','streak_7','top3'], submissions: [] },
  { id: 'admin1', name: 'Dr. Sarah Mitchell', email: 'admin@campus.edu', role: 'admin', xp: 0, streak: 0, completedTasks: 0, badges: [], submissions: [] },
];

// ============ STATE ============
window.AppState = {
  currentUser: null,
  users: [],
  tasks: [],
  submissions: [],
  notifications: [],
  currentPage: 'dashboard',
};

// ============ LOCALSTORAGE HELPERS ============
const Storage = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem('cc_' + key)); } catch { return null; }
  },
  set: (key, val) => {
    try { localStorage.setItem('cc_' + key, JSON.stringify(val)); } catch {}
  },
  remove: (key) => localStorage.removeItem('cc_' + key),
};

// ============ INIT DATA ============
function initData() {
  // Always use the latest DUMMY_USERS to ensure names like Joydip are available
  Storage.set('users', DUMMY_USERS);
  AppState.users = DUMMY_USERS;

  let tasks = Storage.get('tasks');
  if (!tasks || tasks.length === 0) {
    Storage.set('tasks', DUMMY_TASKS);
    tasks = DUMMY_TASKS;
  }
  AppState.tasks = tasks;

  let submissions = Storage.get('submissions');
  if (!submissions) {
    Storage.set('submissions', []);
    submissions = [];
  }
  AppState.submissions = submissions;

  let notifs = Storage.get('notifications');
  if (!notifs) {
    Storage.set('notifications', [
      { id: 'n1', icon: '🎯', title: 'New Task Available', desc: 'Promote Event on LinkedIn is now live', time: '2 hours ago', read: false },
      { id: 'n2', icon: '🏆', title: 'Leaderboard Update', desc: 'You moved up to rank #4!', time: '1 day ago', read: false },
      { id: 'n3', icon: '✅', title: 'Task Approved', desc: 'Your blog post submission was approved', time: '2 days ago', read: true },
    ]);
    notifs = Storage.get('notifications');
  }
  AppState.notifications = notifs;
}

function saveUsers() { Storage.set('users', AppState.users); }
function saveTasks() { Storage.set('tasks', AppState.tasks); }
function saveSubmissions() { Storage.set('submissions', AppState.submissions); }
function saveNotifications() { Storage.set('notifications', AppState.notifications); }

// ============ GAMIFICATION ============
function getLevel(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) return { ...LEVELS[i], index: i };
  }
  return { ...LEVELS[0], index: 0 };
}

function getXpProgress(xp) {
  const level = getLevel(xp);
  if (level.index === LEVELS.length - 1) return 100;
  const range = level.max - level.min;
  const progress = xp - level.min;
  return Math.round((progress / range) * 100);
}

function getXpToNextLevel(xp) {
  const level = getLevel(xp);
  if (level.index === LEVELS.length - 1) return 0;
  return level.max - xp;
}

function addXP(userId, amount, reason) {
  const userIdx = AppState.users.findIndex(u => u.id === userId);
  if (userIdx === -1) return;

  const user = AppState.users[userIdx];
  const oldLevel = getLevel(user.xp);
  user.xp += amount;
  const newLevel = getLevel(user.xp);

  // Check badges
  checkBadges(user);

  saveUsers();

  if (AppState.currentUser && AppState.currentUser.id === userId) {
    AppState.currentUser = { ...user };
  }

  // Level up!
  if (newLevel.index > oldLevel.index) {
    showLevelUp(newLevel);
  }

  return user.xp;
}

function checkBadges(user) {
  const toEarn = [];

  if (user.completedTasks >= 1 && !user.badges.includes('first_task')) toEarn.push('first_task');
  if (user.completedTasks >= 5 && !user.badges.includes('tasks_5')) toEarn.push('tasks_5');
  if (user.completedTasks >= 10 && !user.badges.includes('tasks_10')) toEarn.push('tasks_10');
  if (user.xp >= 500 && !user.badges.includes('xp_500')) toEarn.push('xp_500');
  if (user.xp >= 1000 && !user.badges.includes('xp_1000')) toEarn.push('xp_1000');
  if (user.streak >= 3 && !user.badges.includes('streak_3')) toEarn.push('streak_3');
  if (user.streak >= 7 && !user.badges.includes('streak_7')) toEarn.push('streak_7');

  const sorted = [...AppState.users].sort((a, b) => b.xp - a.xp);
  const rank = sorted.findIndex(u => u.id === user.id) + 1;
  if (rank <= 3 && !user.badges.includes('top3')) toEarn.push('top3');
  if (getLevel(user.xp).name === 'Legend' && !user.badges.includes('legend')) toEarn.push('legend');

  toEarn.forEach(badgeId => {
    user.badges.push(badgeId);
    const badge = BADGES_DEF.find(b => b.id === badgeId);
    if (badge) {
      setTimeout(() => {
        showToast('🏅 Badge Unlocked!', `You earned: ${badge.name} ${badge.icon}`, 'success');
        triggerConfetti();
      }, 500);
    }
  });
}

// ============ LEADERBOARD ============
function getLeaderboard() {
  return AppState.users
    .filter(u => u.role !== 'admin')
    .sort((a, b) => b.xp - a.xp)
    .map((u, i) => ({ ...u, rank: i + 1 }));
}

// ============ STREAK ============
function updateStreak(userId) {
  const userIdx = AppState.users.findIndex(u => u.id === userId);
  if (userIdx === -1) return;
  const user = AppState.users[userIdx];
  const today = new Date().toDateString();
  const lastLogin = Storage.get('last_login_' + userId);

  if (!lastLogin) {
    user.streak = 1;
  } else if (lastLogin === today) {
    // same day
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastLogin === yesterday.toDateString()) {
      user.streak = (user.streak || 0) + 1;
    } else {
      user.streak = 1; // reset
    }
  }

  Storage.set('last_login_' + userId, today);
  saveUsers();
  if (AppState.currentUser && AppState.currentUser.id === userId) {
    AppState.currentUser = { ...user };
  }
}

// ============ TOAST ============
function showToast(title, message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: '💡', warning: '⚠️', xp: '⚡', levelup: '🎉' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-message">${message}</div>` : ''}
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('exit');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============ CONFETTI ============
function triggerConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  const colors = ['#6c63ff', '#00d4ff', '#00ff88', '#ffd700', '#ff2d78', '#ff6b35'];
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left: ${Math.random() * 100}vw;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${4 + Math.random() * 8}px;
      height: ${4 + Math.random() * 8}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      animation-duration: ${1.5 + Math.random() * 2}s;
      animation-delay: ${Math.random() * 0.5}s;
    `;
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 4000);
}

// ============ LEVEL UP ============
function showLevelUp(newLevel) {
  const overlay = document.getElementById('levelupOverlay');
  if (overlay) {
    overlay.querySelector('#levelupEmoji').textContent = newLevel.icon;
    overlay.querySelector('#levelupName').textContent = newLevel.name;
    overlay.classList.add('show');
    setTimeout(() => overlay.classList.remove('show'), 4000);
  }
  
  triggerConfetti();
  showToast('🎉 Level Up!', `You're now a ${newLevel.name}!`, 'levelup', 5000);

  // Add glow effect to level badges
  document.querySelectorAll('.level-badge').forEach(badge => {
    badge.className = `level-badge level-${newLevel.name.toLowerCase().replace(' ','')} badge-glow`;
    badge.innerHTML = `${newLevel.icon} ${newLevel.name}`;
    setTimeout(() => badge.classList.remove('badge-glow'), 4000);
  });
}

// ============ ANIMATED COUNTER ============
function animateCounter(el, target, duration = 800) {
  const start = parseInt(el.textContent.replace(/\D/g, '')) || 0;
  const range = target - start;
  const startTime = performance.now();

  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + range * eased);
    el.textContent = current.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
}

// ============ RELATIVE TIME ============
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ============ DIFFICULTY COLOR ============
function difficultyColor(d) {
  const map = { Easy: '#00ff88', Medium: '#00d4ff', Hard: '#ff6b35', Expert: '#ff2d78' };
  return map[d] || '#94a3b8';
}

// ============ GENERATE ID ============
function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

// ============ SIMULATED REAL-TIME ============
function simulateLeaderboardUpdate() {
  setInterval(() => {
    // randomly nudge a dummy user's XP slightly
    const ambassadors = AppState.users.filter(u => u.role !== 'admin' && u.id !== (AppState.currentUser?.id));
    if (ambassadors.length === 0) return;
    const randomUser = ambassadors[Math.floor(Math.random() * ambassadors.length)];
    const idx = AppState.users.findIndex(u => u.id === randomUser.id);
    if (idx !== -1 && AppState.users[idx].id !== AppState.currentUser?.id) {
      AppState.users[idx].xp += Math.floor(Math.random() * 15);
      saveUsers();
      if (AppState.currentPage === 'leaderboard') {
        renderLeaderboard();
      }
    }
  }, 8000);
}

// ============ EXPORT ============
window.Storage = Storage;
window.LEVELS = LEVELS;
window.BADGES_DEF = BADGES_DEF;
window.getLevel = getLevel;
window.getXpProgress = getXpProgress;
window.getXpToNextLevel = getXpToNextLevel;
window.addXP = addXP;
window.checkBadges = checkBadges;
window.getLeaderboard = getLeaderboard;
window.updateStreak = updateStreak;
window.showToast = showToast;
window.triggerConfetti = triggerConfetti;
window.showLevelUp = showLevelUp;
window.animateCounter = animateCounter;
window.timeAgo = timeAgo;
window.difficultyColor = difficultyColor;
window.genId = genId;
window.initData = initData;
window.saveUsers = saveUsers;
window.saveTasks = saveTasks;
window.saveSubmissions = saveSubmissions;
window.saveNotifications = saveNotifications;
window.simulateLeaderboardUpdate = simulateLeaderboardUpdate;
