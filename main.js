/* ============================================
   MAIN.JS - App Router & Page Renderers
   ============================================ */

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  initData();

  const loggedIn = initAuth();
  if (loggedIn) {
    showAppPage();
    initApp();
  } else {
    showAuthPage();
  }
});

function initApp() {
  renderSidebar();
  renderTopbar();
  navigateTo('dashboard');
  simulateLeaderboardUpdate();

  // ── Premium Upgrade Boot ──
  if (AppState.currentUser && AppState.currentUser.role !== 'admin') {
    // Streak tracking (runs once per session)
    if (typeof initStreak === 'function') initStreak(AppState.currentUser.id);
  }

  // Visual Themes
  if (typeof initThemes === 'function') initThemes();

  // Micro-interactions & animation patches
  if (typeof initAnimations === 'function') initAnimations();

  // Ensure indicator is positioned on first load
  setTimeout(() => {
    animateNavIndicator(AppState.currentPage);
  }, 500);

  // Store baseline leaderboard for rank-change detection
  setPrevLeaderboard(getLeaderboard());
}

// ============ ROUTER ============
function navigateTo(page) {
  AppState.currentPage = page;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Close mobile sidebar
  document.querySelector('.sidebar')?.classList.remove('mobile-open');
  document.querySelector('.sidebar-overlay')?.classList.remove('show');

  // Render page
  const content = document.getElementById('pageContent');
  if (!content) return;

  content.innerHTML = '<div style="padding:40px;text-align:center"><div class="skeleton" style="height:200px;margin-bottom:16px;border-radius:16px"></div><div class="skeleton" style="height:120px;border-radius:16px"></div></div>';

  setTimeout(() => {
    content.innerHTML = `<div class="page-section active" id="page_${page}">${getPageHTML(page)}</div>`;
    afterPageRender(page);
  }, 200);
}

function getPageHTML(page) {
  const user = AppState.currentUser;
  if (!user) return '';

  switch(page) {
    case 'dashboard': return renderDashboard();
    case 'tasks': return renderTasksPage();
    case 'leaderboard': return '<div id="leaderboardContent"></div>';
    case 'profile': return renderProfile();
    case 'admin': return user.role === 'admin' ? renderAdminPanel() : '<div class="empty-state"><div class="empty-icon">🔒</div><div class="empty-title">Access Denied</div><div class="empty-desc">This page is for admins only.</div></div>';
    default: return renderDashboard();
  }
}

function afterPageRender(page) {
  if (page === 'leaderboard') {
    const lb = getLeaderboard();
    setPrevLeaderboard(lb);
    renderLeaderboard();
  }
  if (page === 'dashboard') {
    animateDashboardCounters();
    renderDashboardTasks();
    updateSidebarXP();
    // XP sparkline
    if (AppState.currentUser?.role !== 'admin') {
      renderXPSparkline('xpSparklineContainer', AppState.currentUser.xp);
    }
  }
  if (page === 'profile') {
    // Animate profile XP bar in
    setTimeout(() => initProgressBarAnimations(), 100);
  }
  // Stagger card entrances
  setTimeout(() => {
    staggerEntrance('.stat-card', 70, 0);
    staggerEntrance('.task-card', 55, 0);
    initCardTilt('.stat-card');
  }, 320);
}

// ============ SIDEBAR ============
function renderSidebar() {
  const user = AppState.currentUser;
  if (!user) return;
  const level = getLevel(user.xp);
  const progress = getXpProgress(user.xp);

  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-icon">🎓</div>
      <div class="logo-text">Campus<span>Connect</span></div>
    </div>

    <div class="sidebar-user">
      <div class="user-avatar">${user.name.charAt(0)}</div>
      <div class="user-info-sidebar">
        <div class="user-name-sidebar">${user.name}</div>
        <span class="user-role-badge ${user.role}">${user.role === 'admin' ? '⚙️ Admin' : '🎓 Ambassador'}</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section-label">Menu</div>
      <a class="nav-item" data-page="dashboard" onclick="navigateTo('dashboard')">
        <span class="nav-icon">🏠</span> Dashboard
      </a>
      <a class="nav-item" data-page="tasks" onclick="navigateTo('tasks')">
        <span class="nav-icon">📋</span> Tasks
        <span class="nav-badge" id="pendingTasksBadge">${getPendingTasksCount()}</span>
      </a>
      <a class="nav-item" data-page="leaderboard" onclick="navigateTo('leaderboard')">
        <span class="nav-icon">🏆</span> Leaderboard
      </a>
      <a class="nav-item" data-page="profile" onclick="navigateTo('profile')">
        <span class="nav-icon">👤</span> Profile
      </a>
      ${user.role === 'admin' ? `
        <div class="nav-section-label" style="margin-top:12px">Admin</div>
        <a class="nav-item" data-page="admin" onclick="navigateTo('admin')">
          <span class="nav-icon">⚙️</span> Admin Panel
          <span class="nav-badge" style="background:var(--accent-pink)">${getPendingSubmissions()}</span>
        </a>
      ` : ''}
    </nav>

    <div class="sidebar-footer">
      ${user.role !== 'admin' ? `
        <div class="xp-widget">
          <div class="xp-widget-header">
            <span class="xp-level-label">${level.icon} ${level.name}</span>
            <span class="xp-value" id="sidebarXPVal">${user.xp.toLocaleString()} XP</span>
          </div>
          <div class="xp-progress-bar">
            <div class="xp-progress-fill" id="sidebarXPBar" style="width:${progress}%"></div>
          </div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:6px">${getXpToNextLevel(user.xp)} XP to next level</div>
        </div>
      ` : ''}
      <a class="nav-item" onclick="logout()" style="color:var(--accent-pink);margin-top:4px">
        <span class="nav-icon">🚪</span> Logout
      </a>
    </div>
  `;
}

function getPendingTasksCount() {
  if (!AppState.currentUser) return 0;
  const subs = getUserSubmissions(AppState.currentUser.id);
  const submittedIds = subs.map(s => s.taskId);
  return AppState.tasks.filter(t => !submittedIds.includes(t.id)).length;
}

function getPendingSubmissions() {
  return AppState.submissions.filter(s => s.status === 'submitted').length;
}

function updateSidebarXP() {
  const user = AppState.currentUser;
  if (!user) return;
  const xpVal = document.getElementById('sidebarXPVal');
  const xpBar = document.getElementById('sidebarXPBar');
  if (xpVal) xpVal.textContent = user.xp.toLocaleString() + ' XP';
  if (xpBar) xpBar.style.width = getXpProgress(user.xp) + '%';
}

// ============ TOPBAR ============
function renderTopbar() {
  const user = AppState.currentUser;
  if (!user) return;
  const topbar = document.getElementById('topbar');

  topbar.innerHTML = `
    <button class="menu-toggle" onclick="toggleMobileSidebar()">☰</button>

    <div class="topbar-title" id="pageTitle">Dashboard</div>

    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input type="text" placeholder="Search..." oninput="handleSearch(this.value)">
    </div>

    <div class="topbar-actions">
      <div style="position:relative">
        <button class="icon-btn" onclick="toggleNotifications()" id="notifBtn">
          🔔
          <span class="notification-dot" id="notifDot"></span>
        </button>
        <div class="notif-dropdown" id="notifDropdown">
          ${renderNotifications()}
        </div>
      </div>

      <button class="icon-btn" onclick="toggleTheme()" id="themeBtn" title="Toggle dark/light mode">🌙</button>

      ${user.role !== 'admin' ? `
        <div class="streak-badge">🔥 ${user.streak} day${user.streak !== 1 ? 's' : ''}</div>
      ` : ''}
    </div>
  `;

  updateNotifBadge();
  applyTheme();
}

function toggleMobileSidebar() {
  document.getElementById('sidebar').classList.toggle('mobile-open');
  document.querySelector('.sidebar-overlay').classList.toggle('show');
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next === 'dark' ? '' : 'light');
  Storage.set('theme', next);
  document.getElementById('themeBtn').textContent = next === 'light' ? '☀️' : '🌙';
}

function applyTheme() {
  const theme = Storage.get('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = theme === 'light' ? '☀️' : '🌙';
}

function toggleNotifications() {
  const dropdown = document.getElementById('notifDropdown');
  dropdown.classList.toggle('show');
  if (dropdown.classList.contains('show')) {
    // Mark as read
    AppState.notifications.forEach(n => n.read = true);
    saveNotifications();
    updateNotifBadge();
    dropdown.innerHTML = renderNotifications();
  }
}

function renderNotifications() {
  const notifs = AppState.notifications.slice(0, 6);
  if (!notifs.length) return `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:0.85rem">No notifications</div>`;

  return `
    <div class="notif-header">
      <span>Notifications</span>
      <span style="font-size:0.72rem;color:var(--text-muted);font-family:var(--font-body)">${notifs.filter(n=>!n.read).length} unread</span>
    </div>
    ${notifs.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}">
        <span class="notif-item-icon">${n.icon}</span>
        <div>
          <div class="notif-item-title">${n.title}</div>
          <div class="notif-item-desc">${n.desc}</div>
          <div class="notif-item-time">${n.time}</div>
        </div>
      </div>
    `).join('')}
  `;
}

function updateNotifBadge() {
  const unread = AppState.notifications.filter(n => !n.read).length;
  const dot = document.getElementById('notifDot');
  if (dot) dot.style.display = unread > 0 ? 'block' : 'none';
}

// Close notifications on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('#notifBtn') && !e.target.closest('#notifDropdown')) {
    document.getElementById('notifDropdown')?.classList.remove('show');
  }
});

function handleSearch(val) {
  // Could filter current page content
}

// ============ DASHBOARD ============
function renderDashboard() {
  const user = AppState.currentUser;
  const level = getLevel(user.xp);
  const progress = getXpProgress(user.xp);
  const xpToNext = getXpToNextLevel(user.xp);
  const lb = getLeaderboard();
  const userRank = lb.findIndex(u => u.id === user.id) + 1;
  // Use smart recommendation engine if available
  const recommended = (typeof getSmartRecommendedTask === 'function')
    ? getSmartRecommendedTask()
    : getRecommendedTask();

  return `
    <!-- Welcome -->
    <div style="margin-bottom:28px">
      <h2 style="font-family:var(--font-display);font-size:1.8rem;font-weight:700;margin-bottom:4px">
        Hello, <span class="text-gradient">${user.name.split(' ')[0]}</span> 👋
      </h2>
      <p style="color:var(--text-secondary);font-size:0.9rem">
        ${user.role === 'admin' ? 'Manage your ambassadors and review submissions.' : "Keep up the momentum — you're doing great!"}
      </p>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid" style="margin-bottom:24px">
      <div class="card stat-card">
        <div class="stat-icon-wrap" style="background:rgba(108,99,255,0.12)">⚡</div>
        <div>
          <div class="stat-label">Total XP</div>
          <div class="stat-value" id="statXP">${user.xp.toLocaleString()}</div>
        </div>
        <div class="stat-change">+${Math.min(user.xp, 280)} this week</div>
      </div>

      <div class="card stat-card">
        <div class="stat-icon-wrap" style="background:rgba(255,215,0,0.12)">🏆</div>
        <div>
          <div class="stat-label">Current Level</div>
          <div class="stat-value" style="font-size:1.2rem;padding-top:4px">${level.icon} ${level.name}</div>
        </div>
        <div style="margin-top:2px">
          <div class="progress-bar" style="margin-top:6px">
            <div class="progress-fill" style="width:${progress}%;background:var(--gradient-gold)"></div>
          </div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px">${xpToNext > 0 ? `${xpToNext} XP to next level` : 'Max Level!'}</div>
        </div>
      </div>

      <div class="card stat-card">
        <div class="stat-icon-wrap" style="background:rgba(255,107,53,0.12)">🔥</div>
        <div>
          <div class="stat-label">Day Streak</div>
          <div class="stat-value" id="statStreak">${user.streak}</div>
        </div>
        <div class="stat-change">Keep it going!</div>
      </div>

      <div class="card stat-card">
        <div class="stat-icon-wrap" style="background:rgba(0,255,136,0.1)">📋</div>
        <div>
          <div class="stat-label">Tasks Done</div>
          <div class="stat-value" id="statTasks">${user.completedTasks}</div>
        </div>
        ${userRank > 0 && user.role !== 'admin' ? `<div style="font-size:0.78rem;color:var(--accent-gold);font-weight:600">Rank #${userRank} on leaderboard</div>` : ''}
      </div>
    </div>

    <!-- Main Grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
      <!-- Today's Tasks -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📋 Today's Tasks</span>
          <button class="btn btn-ghost btn-sm" onclick="navigateTo('tasks')">View All →</button>
        </div>
        <div class="card-body" id="dashboardTasks">
          <div class="skeleton" style="height:60px;margin-bottom:8px;border-radius:10px"></div>
          <div class="skeleton" style="height:60px;border-radius:10px"></div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">⚡ Recent Activity</span>
        </div>
        <div class="card-body">
          ${renderActivityFeed()}
        </div>
      </div>
    </div>

    <!-- Bottom Row -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:24px">
      <!-- Leaderboard Snapshot -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🏆 Top Ambassadors</span>
          <button class="btn btn-ghost btn-sm" onclick="navigateTo('leaderboard')">Full →</button>
        </div>
        <div class="card-body">
          ${renderMiniLeaderboard()}
        </div>
      </div>

      <!-- Recommended Task -->
      <div class="card" style="grid-column:span 2">
        <div class="card-header">
          <span class="card-title">💡 Recommended For You</span>
          <span style="font-size:0.75rem;color:var(--text-muted)">Based on your level</span>
        </div>
        <div class="card-body">
          ${recommended ? renderRecommendedTask(recommended) : `
            <div class="empty-state" style="padding:30px 20px">
              <div class="empty-icon">🎉</div>
              <div class="empty-title">All caught up!</div>
              <div class="empty-desc">You've engaged with all available tasks.</div>
            </div>
          `}
        </div>
      </div>
    </div>

    <!-- XP Sparkline Chart -->
    ${user.role !== 'admin' ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
      <div id="xpSparklineContainer"></div>
      ${renderStreakCard(user.id)}
    </div>` : ''}
  `;
}

function renderDashboardTasks() {
  const container = document.getElementById('dashboardTasks');
  if (!container) return;
  const user = AppState.currentUser;
  const subs = getUserSubmissions(user.id);
  const submittedIds = subs.map(s => s.taskId);
  const pending = AppState.tasks.filter(t => !submittedIds.includes(t.id)).slice(0, 3);

  if (!pending.length) {
    container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:0.85rem">🎉 All tasks done or submitted!</div>`;
    return;
  }

  container.innerHTML = pending.map(task => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-color)">
      <div style="flex:1;min-width:0">
        <div style="font-size:0.85rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${task.title}</div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px">⚡ ${task.xp} XP • ${task.category}</div>
      </div>
      <button class="btn btn-primary btn-sm" style="margin-left:10px;flex-shrink:0" onclick="openSubmitModal('${task.id}')">Start</button>
    </div>
  `).join('');
}

function renderActivityFeed() {
  const user = AppState.currentUser;
  const subs = getUserSubmissions(user.id).slice(0, 5);

  const activities = [
    { dot: '#6c63ff', text: `Joined CampusConnect as ${user.role}`, time: 'Welcome!' },
    ...subs.map(s => {
      const task = AppState.tasks.find(t => t.id === s.taskId);
      return {
        dot: s.status === 'approved' ? '#00ff88' : s.status === 'rejected' ? '#ff2d78' : '#00d4ff',
        text: `${s.status === 'approved' ? '✅ Approved' : s.status === 'rejected' ? '❌ Rejected' : '📤 Submitted'}: ${task?.title || 'Task'}`,
        time: timeAgo(s.submittedAt)
      };
    })
  ].reverse().slice(0, 5);

  if (!activities.length) {
    return `<div class="empty-state" style="padding:20px"><div class="empty-icon" style="font-size:32px">📭</div><div class="empty-title" style="font-size:0.9rem">No activity yet</div><div class="empty-desc" style="font-size:0.78rem">Complete tasks to see your activity</div></div>`;
  }

  return `<div class="activity-feed">
    ${activities.map(a => `
      <div class="activity-item">
        <div class="activity-dot" style="background:${a.dot};box-shadow:0 0 6px ${a.dot}55"></div>
        <div class="activity-content">
          <div class="activity-text">${a.text}</div>
          <div class="activity-time">${a.time}</div>
        </div>
      </div>
    `).join('')}
  </div>`;
}

function renderMiniLeaderboard() {
  const lb = getLeaderboard().slice(0, 5);
  return lb.map(user => {
    const isMe = user.id === AppState.currentUser?.id;
    return `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border-color)">
        <div class="rank-badge rank-${user.rank <= 3 ? user.rank : 'other'}" style="width:24px;height:24px;font-size:0.7rem">${user.rank <= 3 ? ['🥇','🥈','🥉'][user.rank-1] : user.rank}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:0.82rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${user.name.split(' ')[0]} ${isMe ? '(you)' : ''}</div>
        </div>
        <div style="font-family:var(--font-mono);font-size:0.75rem;color:var(--accent-gold)">${user.xp.toLocaleString()}</div>
      </div>
    `;
  }).join('');
}

function renderRecommendedTask(task) {
  return `
    <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap">
      <div style="flex:1;min-width:200px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:${difficultyColor(task.difficulty)};letter-spacing:0.5px">${task.difficulty}</span>
          <span style="font-size:0.72rem;color:var(--text-muted)">• ${task.category}</span>
        </div>
        <h3 style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;margin-bottom:8px">${task.title}</h3>
        <p style="font-size:0.83rem;color:var(--text-secondary);line-height:1.5;margin-bottom:14px">${task.description}</p>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="btn btn-primary" onclick="openSubmitModal('${task.id}')">Start Task</button>
          <span class="task-xp">⚡ +${task.xp} XP</span>
          <span style="font-size:0.78rem;color:var(--text-muted)">📅 Due ${task.deadline}</span>
        </div>
      </div>
      <div style="width:80px;height:80px;border-radius:16px;background:rgba(108,99,255,0.1);border:1px solid rgba(108,99,255,0.2);display:flex;align-items:center;justify-content:center;font-size:36px;flex-shrink:0">
        ${task.category === 'Social Media' ? '📱' : task.category === 'Recruitment' ? '👥' : task.category === 'Content' ? '✍️' : task.category === 'Events' ? '🎪' : '📋'}
      </div>
    </div>
  `;
}

function animateDashboardCounters() {
  setTimeout(() => {
    const user = AppState.currentUser;
    const xpEl = document.getElementById('statXP');
    const streakEl = document.getElementById('statStreak');
    const tasksEl = document.getElementById('statTasks');
    if (xpEl) animateCounter(xpEl, user.xp);
    if (streakEl) animateCounter(streakEl, user.streak);
    if (tasksEl) animateCounter(tasksEl, user.completedTasks);
  }, 100);
}

// ============ PROFILE PAGE ============
function renderProfile() {
  const user = AppState.currentUser;
  const level = getLevel(user.xp);
  const progress = getXpProgress(user.xp);
  const subs = getUserSubmissions(user.id);
  const approved = subs.filter(s => s.status === 'approved');
  const lb = getLeaderboard();
  const rank = lb.findIndex(u => u.id === user.id) + 1;

  return `
    <!-- Profile Hero -->
    <div class="profile-hero card">
      <div class="profile-hero-content">
        <div class="profile-avatar-large">${user.name.charAt(0)}</div>
        <div class="profile-info-main">
          <div class="profile-name">${user.name}</div>
          <div class="profile-meta" style="margin-top:8px">
            <span class="level-badge level-${level.name.toLowerCase().replace(' ','')}">${level.icon} ${level.name}</span>
            <span style="font-size:0.8rem;color:var(--text-secondary)">📧 ${user.email}</span>
            ${user.role !== 'admin' && rank > 0 ? `<span style="font-size:0.8rem;color:var(--accent-gold);font-weight:700">🏆 Rank #${rank}</span>` : ''}
          </div>

          <!-- XP Bar -->
          <div style="margin-top:14px;max-width:340px">
            <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--text-muted);margin-bottom:5px">
              <span>${user.xp.toLocaleString()} XP</span>
              <span>${level.max !== Infinity ? level.max.toLocaleString() + ' XP' : 'Max Level'}</span>
            </div>
            <div class="progress-bar" style="height:8px">
              <div class="progress-fill" style="width:${progress}%;background:var(--gradient-gold)"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="profile-stat-row">
        <div class="profile-stat-item">
          <div class="profile-stat-val">${user.xp.toLocaleString()}</div>
          <div class="profile-stat-label">Total XP</div>
        </div>
        <div class="profile-stat-item">
          <div class="profile-stat-val">${user.completedTasks}</div>
          <div class="profile-stat-label">Tasks Done</div>
        </div>
        <div class="profile-stat-item">
          <div class="profile-stat-val">🔥 ${user.streak}</div>
          <div class="profile-stat-label">Day Streak</div>
        </div>
        <div class="profile-stat-item">
          <div class="profile-stat-val">${user.badges.length}</div>
          <div class="profile-stat-label">Badges</div>
        </div>
      </div>
    </div>

    <!-- Badges + Submissions Grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <!-- Badges -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🏅 Badges</span>
          <span style="font-size:0.78rem;color:var(--text-muted)">${user.badges.length}/${BADGES_DEF.length} earned</span>
        </div>
        <div class="card-body">
          <div class="badges-grid">
            ${BADGES_DEF.map(badge => `
              <div class="badge-item ${user.badges.includes(badge.id) ? '' : 'locked'}" title="${badge.desc}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Task History -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📋 Submissions</span>
          <span style="font-size:0.78rem;color:var(--text-muted)">${subs.length} total</span>
        </div>
        <div class="card-body" style="max-height:320px;overflow-y:auto">
          ${subs.length === 0 ? `
            <div class="empty-state" style="padding:30px">
              <div class="empty-icon" style="font-size:32px">📭</div>
              <div class="empty-title" style="font-size:0.9rem">No submissions yet</div>
              <div class="empty-desc" style="font-size:0.78rem">Complete tasks to see history</div>
            </div>
          ` : subs.map(sub => {
            const task = AppState.tasks.find(t => t.id === sub.taskId);
            return `
              <div style="padding:10px 0;border-bottom:1px solid var(--border-color)">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
                  <span style="font-size:0.83rem;font-weight:600">${task?.title || 'Unknown Task'}</span>
                  <span class="task-status-badge status-${sub.status}">${sub.status}</span>
                </div>
                <div style="font-size:0.72rem;color:var(--text-muted)">${timeAgo(sub.submittedAt)}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
    
    <!-- Theme Selector -->
    ${typeof renderThemeSelector === 'function' ? renderThemeSelector() : ''}
  `;
}

// ============ ADMIN PANEL ============
function renderAdminPanel() {
  return `
    <div style="margin-bottom:24px">
      <h2 class="topbar-title" style="font-size:1.6rem">Admin <span>Panel</span></h2>
      <p style="color:var(--text-secondary);font-size:0.85rem">Create tasks, review submissions, monitor ambassadors</p>
    </div>

    <div class="tabs" style="margin-bottom:24px">
      <button class="tab-btn active" onclick="switchAdminTab('submissions', this)">📥 Submissions (${AppState.submissions.filter(s=>s.status==='submitted').length})</button>
      <button class="tab-btn" onclick="switchAdminTab('create', this)">➕ Create Task</button>
      <button class="tab-btn" onclick="switchAdminTab('ambassadors', this)">👥 Ambassadors</button>
      <button class="tab-btn" onclick="switchAdminTab('tasks', this)">📋 All Tasks</button>
    </div>

    <div id="adminTabContent">
      ${renderAdminSubmissions()}
    </div>
  `;
}

function switchAdminTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const content = document.getElementById('adminTabContent');
  content.style.opacity = '0';
  setTimeout(() => {
    content.innerHTML = tab === 'submissions' ? renderAdminSubmissions()
      : tab === 'create' ? renderCreateTaskForm()
      : tab === 'ambassadors' ? renderAmbassadorsList()
      : renderAdminTasksList();
    content.style.transition = 'opacity 0.2s';
    content.style.opacity = '1';
  }, 150);
}

function renderAdminSubmissions() {
  const pending = AppState.submissions.filter(s => s.status === 'submitted');

  if (!pending.length) return `
    <div class="empty-state">
      <div class="empty-icon">✅</div>
      <div class="empty-title">All caught up!</div>
      <div class="empty-desc">No pending submissions to review.</div>
    </div>
  `;

  return `
    <div class="card">
      <div class="card-header"><span class="card-title">Pending Reviews</span></div>
      <div class="card-body" style="padding:0 0 8px">
        <table class="admin-table">
          <thead><tr><th>Ambassador</th><th>Task</th><th>Proof</th><th>Submitted</th><th>Actions</th></tr></thead>
          <tbody>
            ${pending.map(sub => {
              const task = AppState.tasks.find(t => t.id === sub.taskId);
              const user = AppState.users.find(u => u.id === sub.userId);
              return `
                <tr>
                  <td><div style="font-weight:600">${user?.name || 'Unknown'}</div></td>
                  <td>
                    <div style="font-weight:600;font-size:0.83rem">${task?.title || 'Unknown'}</div>
                    <div style="font-size:0.72rem;color:var(--accent-gold)">⚡ ${task?.xp || 0} XP</div>
                  </td>
                  <td><a href="${sub.proofUrl}" target="_blank" style="color:var(--accent-primary);font-size:0.82rem;text-decoration:none">View Proof →</a>${sub.notes ? `<div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px">${sub.notes}</div>` : ''}</td>
                  <td style="font-size:0.78rem;color:var(--text-muted)">${timeAgo(sub.submittedAt)}</td>
                  <td>
                    <div style="display:flex;gap:6px">
                      <button class="btn btn-success btn-sm" onclick="reviewSubmission('${sub.id}', 'approved')">✅ Approve</button>
                      <button class="btn btn-danger btn-sm" onclick="reviewSubmission('${sub.id}', 'rejected')">❌ Reject</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function reviewSubmission(subId, decision) {
  const subIdx = AppState.submissions.findIndex(s => s.id === subId);
  if (subIdx === -1) return;
  const sub = AppState.submissions[subIdx];
  sub.status = decision;
  saveSubmissions();

  if (decision === 'approved') {
    const task = AppState.tasks.find(t => t.id === sub.taskId);
    const xpAwarded = task?.xp || 100;

    // Use animated XP if available, else fallback
    if (typeof addXPAnimated === 'function') {
      addXPAnimated(sub.userId, xpAwarded, `Task approved: ${task?.title}`);
    } else {
      addXP(sub.userId, xpAwarded, `Task approved: ${task?.title}`);
    }

    // Update completed tasks count + check badges with animation
    const userIdx = AppState.users.findIndex(u => u.id === sub.userId);
    if (userIdx !== -1) {
      AppState.users[userIdx].completedTasks += 1;
      if (typeof checkBadgesAnimated === 'function') {
        checkBadgesAnimated(AppState.users[userIdx]);
      } else {
        checkBadges(AppState.users[userIdx]);
      }
      saveUsers();
    }

    showToast('✅ Approved!', `Awarded ${xpAwarded} XP to ${sub.userName}`, 'success');
  } else {
    showToast('❌ Rejected', `Submission by ${sub.userName} has been rejected.`, 'error');
  }

  // Re-render
  document.getElementById('adminTabContent').innerHTML = renderAdminSubmissions();
}

function renderCreateTaskForm() {
  return `
    <div class="card" style="max-width:600px">
      <div class="card-header"><span class="card-title">Create New Task</span></div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label">Task Title</label>
          <input id="newTaskTitle" type="text" class="form-control" placeholder="e.g. Share on LinkedIn">
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="newTaskDesc" class="form-control" placeholder="Describe what ambassadors need to do..."></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">XP Reward</label>
            <input id="newTaskXP" type="number" class="form-control" placeholder="100" min="10" max="500">
          </div>
          <div class="form-group">
            <label class="form-label">Deadline</label>
            <input id="newTaskDeadline" type="date" class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select id="newTaskCategory" class="form-control">
              <option>Social Media</option>
              <option>Recruitment</option>
              <option>Content</option>
              <option>Events</option>
              <option>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Difficulty</label>
            <select id="newTaskDifficulty" class="form-control">
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
              <option>Expert</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary" onclick="createTask()">Create Task ✨</button>
      </div>
    </div>
  `;
}

function createTask() {
  const title = document.getElementById('newTaskTitle')?.value?.trim();
  const desc = document.getElementById('newTaskDesc')?.value?.trim();
  const xp = parseInt(document.getElementById('newTaskXP')?.value);
  const deadline = document.getElementById('newTaskDeadline')?.value;
  const category = document.getElementById('newTaskCategory')?.value;
  const difficulty = document.getElementById('newTaskDifficulty')?.value;

  if (!title || !desc || !xp || !deadline) {
    showToast('Missing Fields', 'Please fill in all required fields.', 'error');
    return;
  }

  const newTask = {
    id: genId('task'),
    title, description: desc, xp, deadline, category, difficulty,
    createdBy: AppState.currentUser.id,
    status: 'active'
  };

  AppState.tasks.push(newTask);
  saveTasks();
  showToast('✅ Task Created!', `"${title}" is now live for ambassadors.`, 'success');

  // Clear form
  ['newTaskTitle','newTaskDesc','newTaskXP','newTaskDeadline'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function renderAmbassadorsList() {
  const ambassadors = AppState.users.filter(u => u.role !== 'admin').sort((a,b) => b.xp - a.xp);

  return `
    <div class="card">
      <div class="card-header">
        <span class="card-title">All Ambassadors</span>
        <span style="font-size:0.78rem;color:var(--text-muted)">${ambassadors.length} total</span>
      </div>
      <div class="card-body" style="padding:0 0 8px">
        <table class="admin-table">
          <thead><tr><th>Name</th><th>Level</th><th>XP</th><th>Tasks</th><th>Streak</th><th>Badges</th></tr></thead>
          <tbody>
            ${ambassadors.map(u => {
              const level = getLevel(u.xp);
              return `
                <tr>
                  <td><div style="font-weight:600">${u.name}</div><div style="font-size:0.72rem;color:var(--text-muted)">${u.email}</div></td>
                  <td><span class="level-badge level-${level.name.toLowerCase().replace(' ','')}">${level.icon} ${level.name}</span></td>
                  <td><span style="font-family:var(--font-mono);color:var(--accent-gold);font-weight:700">${u.xp.toLocaleString()}</span></td>
                  <td>${u.completedTasks}</td>
                  <td>🔥 ${u.streak}</td>
                  <td>${u.badges.length} 🏅</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAdminTasksList() {
  return `
    <div class="card">
      <div class="card-header">
        <span class="card-title">All Tasks</span>
        <button class="btn btn-primary btn-sm" onclick="switchAdminTab('create', document.querySelector('.tab-btn:nth-child(2)'))">+ New</button>
      </div>
      <div class="card-body" style="padding:0 0 8px">
        <table class="admin-table">
          <thead><tr><th>Title</th><th>Category</th><th>XP</th><th>Difficulty</th><th>Deadline</th><th>Submissions</th></tr></thead>
          <tbody>
            ${AppState.tasks.map(t => {
              const subs = AppState.submissions.filter(s => s.taskId === t.id).length;
              return `
                <tr>
                  <td style="font-weight:600">${t.title}</td>
                  <td>${t.category}</td>
                  <td><span style="color:var(--accent-gold);font-weight:700">⚡ ${t.xp}</span></td>
                  <td><span style="color:${difficultyColor(t.difficulty)};font-weight:600">${t.difficulty}</span></td>
                  <td style="font-size:0.8rem;color:var(--text-muted)">${t.deadline}</td>
                  <td>${subs} submitted</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============ EXPOSE GLOBALS ============
window.navigateTo = navigateTo;
window.initApp = initApp;
window.renderDashboard = renderDashboard;
window.renderDashboardTasks = renderDashboardTasks;
window.renderProfile = renderProfile;
window.renderAdminPanel = renderAdminPanel;
window.switchAdminTab = switchAdminTab;
window.reviewSubmission = reviewSubmission;
window.createTask = createTask;
window.toggleTheme = toggleTheme;
window.toggleNotifications = toggleNotifications;
window.toggleMobileSidebar = toggleMobileSidebar;
window.handleSearch = handleSearch;

// Float animation for podium
const style = document.createElement('style');
style.textContent = `@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`;
document.head.appendChild(style);
