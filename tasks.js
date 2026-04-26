/* ============================================
   TASKS.JS - Task Management System
   ============================================ */

function getUserSubmissions(userId) {
  return AppState.submissions.filter(s => s.userId === userId);
}

function getTaskStatus(taskId, userId) {
  const sub = AppState.submissions.find(s => s.taskId === taskId && s.userId === userId);
  if (!sub) return 'active';
  return sub.status;
}

function renderTasksPage() {
  const user = AppState.currentUser;
  if (!user) return '';

  const tabs = ['All Tasks', 'Active', 'Submitted', 'Approved'];
  const categories = [...new Set(AppState.tasks.map(t => t.category))];

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:gap">
      <div>
        <h2 class="topbar-title" style="font-size:1.6rem">Task <span>Board</span></h2>
        <p style="color:var(--text-secondary);font-size:0.85rem;margin-top:2px">Complete tasks to earn XP and level up</p>
      </div>
      ${user.role === 'admin' ? `<button class="btn btn-primary" onclick="navigateTo('admin')">⚙️ Manage Tasks</button>` : ''}
    </div>

    <div class="tabs" id="taskTabs" style="display:inline-flex;width:auto;margin-bottom:20px">
      ${tabs.map((t, i) => `<button class="tab-btn ${i===0?'active':''}" onclick="filterTasks('${t}', this)">${t}</button>`).join('')}
    </div>

    <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
      ${categories.map(c => `
        <button class="btn btn-ghost btn-sm" onclick="filterByCategory('${c}', this)">${c}</button>
      `).join('')}
      <button class="btn btn-ghost btn-sm active-filter" onclick="filterByCategory('all', this)" style="border-color:var(--accent-primary);color:var(--accent-primary)">All</button>
    </div>

    <div id="tasksGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">
      ${renderTaskCards('All Tasks')}
    </div>
  `;
}

function renderTaskCards(filter = 'All Tasks', category = 'all') {
  const user = AppState.currentUser;
  const userSubs = getUserSubmissions(user.id);

  let tasks = AppState.tasks;

  if (category !== 'all') {
    tasks = tasks.filter(t => t.category === category);
  }

  if (filter !== 'All Tasks') {
    tasks = tasks.filter(t => {
      const sub = userSubs.find(s => s.taskId === t.id);
      const status = sub ? sub.status : 'active';
      return status === filter.toLowerCase();
    });
  }

  if (tasks.length === 0) {
    return `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">📭</div>
        <div class="empty-title">No tasks found</div>
        <div class="empty-desc">No tasks match this filter. Try a different one!</div>
      </div>
    `;
  }

  return tasks.map(task => {
    const sub = userSubs.find(s => s.taskId === task.id);
    const status = sub ? sub.status : 'active';
    const deadline = new Date(task.deadline);
    const isOverdue = deadline < new Date() && status === 'active';
    const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));

    return `
      <div class="task-card ${status}" style="animation:fadeInUp 0.3s ease">
        <div class="task-header">
          <span class="task-title">${task.title}</span>
          <span class="task-xp">⚡ +${task.xp} XP</span>
        </div>
        <p class="task-desc">${task.description}</p>
        <div class="task-meta">
          <span class="task-meta-item">
            <span style="width:8px;height:8px;border-radius:2px;background:${difficultyColor(task.difficulty)};display:inline-block"></span>
            ${task.difficulty}
          </span>
          <span class="task-meta-item">🏷️ ${task.category}</span>
          <span class="task-meta-item ${isOverdue ? 'style="color:var(--accent-pink)"' : ''}">
            📅 ${isOverdue ? 'Overdue' : daysLeft > 0 ? `${daysLeft}d left` : 'Due today'}
          </span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span class="task-status-badge status-${status}">
            ${statusIcon(status)} ${status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          <div class="task-actions">
            ${renderTaskActions(task, status, sub)}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function statusIcon(status) {
  const map = { active: '▶', submitted: '⏳', approved: '✅', rejected: '❌' };
  return map[status] || '●';
}

function renderTaskActions(task, status, sub) {
  if (status === 'active') {
    return `<button class="btn btn-primary btn-sm" onclick="openSubmitModal('${task.id}')">Submit Proof</button>`;
  }
  if (status === 'submitted') {
    return `<button class="btn btn-ghost btn-sm" disabled style="opacity:0.5">Under Review</button>`;
  }
  if (status === 'approved') {
    return `<span style="color:var(--accent-green);font-size:0.8rem;font-weight:600">✅ Completed</span>`;
  }
  if (status === 'rejected') {
    return `<button class="btn btn-secondary btn-sm" onclick="openSubmitModal('${task.id}')">Resubmit</button>`;
  }
  return '';
}

function filterTasks(filter, btn) {
  document.querySelectorAll('#taskTabs .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tasksGrid').innerHTML = renderTaskCards(filter);
}

function filterByCategory(cat, btn) {
  document.querySelectorAll('.active-filter').forEach(b => {
    b.style.borderColor = '';
    b.style.color = '';
  });
  btn.style.borderColor = 'var(--accent-primary)';
  btn.style.color = 'var(--accent-primary)';

  const activeTab = document.querySelector('#taskTabs .tab-btn.active')?.textContent || 'All Tasks';
  document.getElementById('tasksGrid').innerHTML = renderTaskCards(activeTab, cat);
}

// ============ SUBMIT MODAL ============
function openSubmitModal(taskId) {
  const task = AppState.tasks.find(t => t.id === taskId);
  if (!task) return;

  const modal = document.getElementById('submitModal');
  modal.querySelector('#submitModalTitle').textContent = task.title;
  modal.querySelector('#submitTaskId').value = taskId;
  modal.querySelector('#submitProofUrl').value = '';
  modal.querySelector('#submitNotes').value = '';
  modal.classList.add('active');
  document.getElementById('modalOverlay').classList.add('active');
}

function closeSubmitModal() {
  document.getElementById('submitModal').classList.remove('active');
  document.getElementById('modalOverlay').classList.remove('active');
}

function handleTaskSubmit() {
  const taskId = document.getElementById('submitTaskId').value;
  const proofUrl = document.getElementById('submitProofUrl').value.trim();
  const notes = document.getElementById('submitNotes').value.trim();

  if (!proofUrl) {
    showToast('Missing Proof', 'Please provide a proof link or description.', 'error');
    return;
  }

  const user = AppState.currentUser;
  const existing = AppState.submissions.findIndex(s => s.taskId === taskId && s.userId === user.id);

  const submission = {
    id: genId('sub'),
    taskId,
    userId: user.id,
    userName: user.name,
    proofUrl,
    notes,
    status: 'approved', // Auto-approve for instant gamification feedback
    submittedAt: new Date().toISOString(),
  };

  if (existing !== -1) {
    AppState.submissions[existing] = submission;
  } else {
    AppState.submissions.push(submission);
  }

  saveSubmissions();
  closeSubmitModal();
  showToast('✅ Auto-Approved!', 'Hackathon Demo: Task approved automatically.', 'success');

  // Trigger Gamification Engine instantly!
  const taskObj = AppState.tasks.find(t => t.id === taskId);
  if (taskObj) {
    // Small delay to let modal close
    setTimeout(() => {
      if (typeof addXPAnimated === 'function') {
        // Trigger floating XP from the center of the screen
        addXPAnimated(user.id, taskObj.xp, `Completed: ${taskObj.title}`);
        
        // Update user completed tasks and check badges
        const userIdx = AppState.users.findIndex(u => u.id === user.id);
        if (userIdx !== -1) {
          AppState.users[userIdx].completedTasks += 1;
          if (typeof checkBadgesAnimated === 'function') {
            checkBadgesAnimated(AppState.users[userIdx]);
          }
          saveUsers();
        }
      }
    }, 400);
  }

  // Add notification
  const notif = {
    id: genId('n'),
    icon: '📤',
    title: 'Task Submitted',
    desc: `"${AppState.tasks.find(t => t.id === taskId)?.title}" sent for review`,
    time: 'Just now',
    read: false,
  };
  AppState.notifications.unshift(notif);
  saveNotifications();
  updateNotifBadge();

  // Re-render tasks if on tasks page
  if (AppState.currentPage === 'tasks') {
    const tasksGrid = document.getElementById('tasksGrid');
    if (tasksGrid) tasksGrid.innerHTML = renderTaskCards('All Tasks');
  }
  if (AppState.currentPage === 'dashboard') {
    renderDashboardTasks();
  }
}

// ============ RECOMMENDED TASK ============
function getRecommendedTask() {
  const user = AppState.currentUser;
  const userSubs = getUserSubmissions(user.id);
  const submittedIds = userSubs.map(s => s.taskId);
  const available = AppState.tasks.filter(t => !submittedIds.includes(t.id));
  if (available.length === 0) return null;

  const level = getLevel(user.xp);
  // Pick task based on level: higher level → harder tasks
  const difficultyMap = { 0: 'Easy', 1: 'Easy', 2: 'Medium', 3: 'Hard', 4: 'Expert' };
  const targetDifficulty = difficultyMap[level.index] || 'Medium';
  return available.find(t => t.difficulty === targetDifficulty) || available[0];
}

window.renderTasksPage = renderTasksPage;
window.renderTaskCards = renderTaskCards;
window.filterTasks = filterTasks;
window.filterByCategory = filterByCategory;
window.openSubmitModal = openSubmitModal;
window.closeSubmitModal = closeSubmitModal;
window.handleTaskSubmit = handleTaskSubmit;
window.getRecommendedTask = getRecommendedTask;
window.getUserSubmissions = getUserSubmissions;
window.getTaskStatus = getTaskStatus;
