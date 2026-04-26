/* ============================================
   THEMES.JS - Unlockable Visual Themes
   CampusConnect Premium Upgrade
   ============================================ */

'use strict';

const THEMES = [
  { id: 'default', name: 'Dark SaaS', reqLevel: 0, preview: 'linear-gradient(135deg, #6c63ff 0%, #00d4ff 100%)' },
  { id: 'cyberpunk', name: 'Neon Cyberpunk', reqLevel: 3, preview: 'linear-gradient(135deg, #ff007f 0%, #00f0ff 100%)' },
  { id: 'legend', name: 'Gold & Onyx', reqLevel: 5, preview: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)' }
];

function initThemes() {
  const savedTheme = localStorage.getItem('cc_active_theme') || 'default';
  applyVisualTheme(savedTheme);
}

function applyVisualTheme(themeId) {
  const user = AppState.currentUser;
  
  // Verify unlock status if logged in
  if (user) {
    const level = getLevel(user.xp);
    const themeDef = THEMES.find(t => t.id === themeId);
    if (themeDef && level.index + 1 < themeDef.reqLevel) {
      // Locked, fallback to default
      themeId = 'default';
    }
  }

  // Remove existing theme classes
  document.body.classList.remove('theme-cyberpunk', 'theme-legend');
  
  if (themeId !== 'default') {
    document.body.classList.add(`theme-${themeId}`);
  }
  
  localStorage.setItem('cc_active_theme', themeId);
}

function selectTheme(themeId) {
  applyVisualTheme(themeId);
  // Optional: Add click ripple or sound effect here
  if (typeof initMicroInteractions === 'function') {
      // re-trigger anything needed
  }
  
  // Re-render profile page if we are on it to update the active state
  if (AppState.currentPage === 'profile') {
      navigateTo('profile');
  }
}

function renderThemeSelector() {
  const user = AppState.currentUser;
  if (!user) return '';

  const level = getLevel(user.xp);
  const activeTheme = localStorage.getItem('cc_active_theme') || 'default';

  const cards = THEMES.map(theme => {
    const isUnlocked = level.index + 1 >= theme.reqLevel;
    const isActive = activeTheme === theme.id;
    const lockedClass = isUnlocked ? '' : 'locked';
    const activeClass = isActive ? 'active' : '';
    
    let lockLabel = '';
    if (!isUnlocked) {
        // Find level name required
        const reqLevelDef = LEVELS.find(l => l.index + 1 === theme.reqLevel) || {name: `Level ${theme.reqLevel}`};
        lockLabel = `<div style="font-size:0.7rem; color:var(--text-muted); margin-top:4px;">🔒 Unlocks at ${reqLevelDef.name}</div>`;
    }

    return `
      <div class="theme-card ${lockedClass} ${activeClass}" 
           ${isUnlocked ? `onclick="selectTheme('${theme.id}')"` : `onclick="showToast('🔒 Locked', 'Reach a higher level to unlock this theme.', 'error')"`}>
        <div class="theme-color-preview" style="background: ${theme.preview}"></div>
        <div style="font-weight:600; color:var(--text-primary);">${theme.name}</div>
        ${lockLabel}
      </div>
    `;
  }).join('');

  return `
    <div class="card" style="margin-top: 24px;">
      <div class="card-header">
        <span class="card-title">🎨 Visual Themes</span>
        <span style="font-size:0.75rem; color:var(--text-muted)">Unlock new aesthetics as you level up.</span>
      </div>
      <div class="card-body">
        <div class="theme-selector-grid">
          ${cards}
        </div>
      </div>
    </div>
  `;
}

window.initThemes = initThemes;
window.applyVisualTheme = applyVisualTheme;
window.selectTheme = selectTheme;
window.renderThemeSelector = renderThemeSelector;
