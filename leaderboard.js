/* ============================================
   LEADERBOARD.JS - Rankings System
   ============================================ */

function renderLeaderboard() {
  const container = document.getElementById('leaderboardContent');
  if (!container) return;

  const newLb = getLeaderboard();
  container.innerHTML = buildLeaderboardHTML();
  animateLeaderboardRows();

  // Detect rank changes (needs baseline from setPrevLeaderboard)
  if (typeof animateRankChanges === 'function') {
    setTimeout(() => animateRankChanges(newLb), 200);
  }
}

function buildLeaderboardHTML() {
  const lb = getLeaderboard();
  const currentUserId = AppState.currentUser?.id;

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px">
      <div>
        <h2 class="topbar-title" style="font-size:1.6rem">Leader<span>board</span></h2>
        <p style="color:var(--text-secondary);font-size:0.85rem">Real-time rankings • Updates automatically</p>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="width:8px;height:8px;border-radius:50%;background:var(--accent-green);display:inline-block;animation:pulse 1s ease-in-out infinite;box-shadow:0 0 8px var(--accent-green)"></span>
        <span style="font-size:0.75rem;color:var(--text-secondary)">Live updates</span>
      </div>
    </div>

    <!-- Top 3 Podium -->
    ${buildPodium(lb)}

    <!-- Full Table -->
    <div class="card" style="margin-top:24px">
      <div class="card-header">
        <span class="card-title">All Rankings</span>
        <span style="font-size:0.78rem;color:var(--text-muted)">${lb.length} ambassadors</span>
      </div>
      <div class="card-body" style="padding:0 0 8px">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th style="width:60px">Rank</th>
              <th>Ambassador</th>
              <th>Level</th>
              <th>XP</th>
              <th>Tasks</th>
              <th>Streak</th>
            </tr>
          </thead>
          <tbody id="lbTableBody">
            ${lb.map(user => buildLeaderboardRow(user, currentUserId)).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function buildPodium(lb) {
  const top3 = lb.slice(0, 3);
  // Reorder for podium: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = top3[1] ? ['110px', '140px', '90px'] : ['110px', '140px'];

  return `
    <div style="display:flex;align-items:flex-end;justify-content:center;gap:12px;margin-bottom:24px;padding:20px 0">
      ${podiumOrder.map((user, i) => {
        const originalRank = lb.findIndex(u => u.id === user.id) + 1;
        const isFirst = originalRank === 1;
        const levelData = getLevel(user.xp);
        const ht = isFirst ? heights[1] : i === 0 ? heights[0] : heights[2];
        const isCurrentUser = user.id === AppState.currentUser?.id;
        const podiumColors = { 1: 'var(--gradient-gold)', 2: 'linear-gradient(135deg,#C0C0C0,#a8a8a8)', 3: 'linear-gradient(135deg,#CD7F32,#b87333)' };

        return `
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;max-width:160px">
            ${isFirst ? `<div style="font-size:28px;animation:float 2s ease-in-out infinite">👑</div>` : ''}
            <div style="width:52px;height:52px;border-radius:50%;background:${podiumColors[originalRank]};display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:${originalRank===1?'#000':'#fff'};border:3px solid ${isCurrentUser?'var(--accent-primary)':'transparent'};box-shadow:${isCurrentUser?'0 0 16px var(--accent-primary)':'none'}">
              ${user.name.charAt(0)}
            </div>
            <div style="text-align:center">
              <div style="font-size:0.82rem;font-weight:700;color:var(--text-primary)">${user.name.split(' ')[0]}</div>
              <div style="font-family:var(--font-mono);font-size:0.75rem;color:var(--accent-gold)">${user.xp.toLocaleString()} XP</div>
            </div>
            <div style="width:100%;height:${ht};background:${podiumColors[originalRank]};border-radius:8px 8px 0 0;display:flex;align-items:flex-start;justify-content:center;padding-top:10px;opacity:0.85">
              <span style="font-size:1.5rem;font-weight:900;color:${originalRank===1?'#000':'rgba(255,255,255,0.8)'}">#${originalRank}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function buildLeaderboardRow(user, currentUserId) {
  const levelData = getLevel(user.xp);
  const progress = getXpProgress(user.xp);
  const isCurrentUser = user.id === currentUserId;

  return `
    <tr class="leaderboard-row ${isCurrentUser ? 'current-user' : ''}" id="lb_row_${user.id}">
      <td>
        <div class="rank-badge rank-${user.rank <= 3 ? user.rank : 'other'}">
          ${user.rank <= 3 ? ['🥇','🥈','🥉'][user.rank-1] : user.rank}
        </div>
      </td>
      <td>
        <div class="lb-user">
          <div class="lb-avatar" style="background:${levelData.color}22;border:1.5px solid ${levelData.color}55;color:${levelData.color}">${user.name.charAt(0)}</div>
          <div>
            <div class="lb-name">${user.name} ${isCurrentUser ? '(you)' : ''}</div>
            <div style="font-size:0.7rem;color:var(--text-muted)">${user.email}</div>
          </div>
        </div>
      </td>
      <td>
        <span class="level-badge level-${levelData.name.toLowerCase().replace(' ','')}">${levelData.icon} ${levelData.name}</span>
      </td>
      <td>
        <div>
          <div class="lb-xp">${user.xp.toLocaleString()}</div>
          <div class="xp-bar-mini" style="margin-top:4px"><div class="xp-bar-fill" style="width:${progress}%"></div></div>
        </div>
      </td>
      <td><span style="font-weight:600">${user.completedTasks}</span><span style="color:var(--text-muted);font-size:0.75rem"> tasks</span></td>
      <td><span style="color:var(--accent-orange);font-weight:700">🔥 ${user.streak}</span></td>
    </tr>
  `;
}

function animateLeaderboardRows() {
  const rows = document.querySelectorAll('.leaderboard-row');
  rows.forEach((row, i) => {
    row.style.opacity = '0';
    row.style.transform = 'translateX(-10px)';
    setTimeout(() => {
      row.style.transition = 'all 0.3s ease';
      row.style.opacity = '1';
      row.style.transform = 'translateX(0)';
    }, i * 50);
  });
}

window.renderLeaderboard = renderLeaderboard;
window.buildLeaderboardHTML = buildLeaderboardHTML;
