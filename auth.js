/* ============================================
   AUTH.JS - Authentication System
   ============================================ */

function initAuth() {
  const saved = Storage.get('currentUser');
  if (saved) {
    AppState.currentUser = saved;
    // return true; // logged in (COMMENTED OUT FOR TESTING LOGIN SCREEN)
  }
  return false;
}

function login(email, password) {
  const user = AppState.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { success: false, error: 'No account found with that email.' };
  // Mock password check (any password works for demo)
  if (password.length < 4) return { success: false, error: 'Password too short.' };

  AppState.currentUser = { ...user };
  Storage.set('currentUser', AppState.currentUser);
  updateStreak(user.id);
  return { success: true, user };
}

function signup(name, email, password, role) {
  if (AppState.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: 'Email already registered.' };
  }
  if (password.length < 4) return { success: false, error: 'Password must be at least 4 characters.' };

  const newUser = {
    id: genId('u'),
    name,
    email,
    role,
    xp: 0,
    streak: 1,
    completedTasks: 0,
    badges: [],
    submissions: [],
    joinedAt: new Date().toISOString(),
  };

  AppState.users.push(newUser);
  saveUsers();
  AppState.currentUser = { ...newUser };
  Storage.set('currentUser', AppState.currentUser);
  Storage.set('last_login_' + newUser.id, new Date().toDateString());
  return { success: true, user: newUser };
}

function logout() {
  AppState.currentUser = null;
  Storage.remove('currentUser');
  showAuthPage();
}

// ============ AUTH PAGE RENDERER ============
function showAuthPage() {
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('authContainer').style.display = 'flex';
  renderAuthPage('login');
}

function showAppPage() {
  document.getElementById('authContainer').style.display = 'none';
  document.getElementById('appContainer').style.display = 'flex';
}

function renderAuthPage(mode = 'login') {
  const container = document.getElementById('authContainer');
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-bg-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>

      <div class="auth-card">
        <div class="auth-logo">
          <div class="auth-logo-icon">🎓</div>
          <h1 class="auth-title">Campus<span class="text-gradient">Connect</span></h1>
          <p class="auth-subtitle">Ambassador Management Platform</p>
        </div>

        ${mode === 'login' ? renderLoginForm() : renderSignupForm()}

        <div class="auth-switch">
          ${mode === 'login'
            ? `Don't have an account? <a onclick="renderAuthPage('signup')">Sign up</a>`
            : `Already have an account? <a onclick="renderAuthPage('login')">Sign in</a>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderLoginForm() {
  return `
    <div id="authError" class="hidden" style="background:rgba(255,45,120,0.12);border:1px solid rgba(255,45,120,0.3);border-radius:8px;padding:10px 14px;font-size:0.82rem;color:#ff2d78;margin-bottom:16px;"></div>

    <div class="form-group">
      <label class="form-label">Email Address</label>
      <input id="loginEmail" type="email" class="form-control" placeholder="you@campus.edu" value="joydip@campus.edu">
    </div>
    <div class="form-group">
      <label class="form-label">Password</label>
      <input id="loginPassword" type="password" class="form-control" placeholder="••••••••" value="Akash@@123">
    </div>

    <button class="btn btn-primary w-full btn-lg" onclick="handleLogin()" style="justify-content:center">
      Sign In →
    </button>

    <div class="auth-divider"><span>quick login</span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="quickLogin('ambassador')" style="justify-content:center">🎓 Ambassador</button>
      <button class="btn btn-ghost btn-sm" onclick="quickLogin('admin')" style="justify-content:center">⚙️ Admin</button>
    </div>
  `;
}

function renderSignupForm() {
  return `
    <div id="authError" class="hidden" style="background:rgba(255,45,120,0.12);border:1px solid rgba(255,45,120,0.3);border-radius:8px;padding:10px 14px;font-size:0.82rem;color:#ff2d78;margin-bottom:16px;"></div>

    <div style="margin-bottom:18px">
      <div class="form-label" style="margin-bottom:10px">I am a...</div>
      <div class="role-selector">
        <div class="role-option selected" id="roleAmbassador" onclick="selectRole('ambassador')">
          <div class="role-option-icon">🎓</div>
          <div class="role-option-label">Ambassador</div>
          <div class="role-option-desc">Complete tasks & earn XP</div>
        </div>
        <div class="role-option" id="roleAdmin" onclick="selectRole('admin')">
          <div class="role-option-icon">⚙️</div>
          <div class="role-option-label">Admin</div>
          <div class="role-option-desc">Manage & approve tasks</div>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Full Name</label>
      <input id="signupName" type="text" class="form-control" placeholder="Your full name">
    </div>
    <div class="form-group">
      <label class="form-label">Email Address</label>
      <input id="signupEmail" type="email" class="form-control" placeholder="you@campus.edu">
    </div>
    <div class="form-group">
      <label class="form-label">Password</label>
      <input id="signupPassword" type="password" class="form-control" placeholder="Min. 4 characters">
    </div>

    <button class="btn btn-primary w-full btn-lg" onclick="handleSignup()" style="justify-content:center;margin-top:8px">
      Create Account →
    </button>
  `;
}

let selectedRole = 'ambassador';

function selectRole(role) {
  selectedRole = role;
  document.querySelectorAll('.role-option').forEach(el => el.classList.remove('selected'));
  document.getElementById(role === 'ambassador' ? 'roleAmbassador' : 'roleAdmin').classList.add('selected');
}

function showAuthError(msg) {
  const el = document.getElementById('authError');
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}

function handleLogin() {
  const email = document.getElementById('loginEmail')?.value?.trim();
  const password = document.getElementById('loginPassword')?.value;
  if (!email || !password) { showAuthError('Please fill in all fields.'); return; }

  const result = login(email, password);
  if (result.success) {
    showToast('Welcome back! 👋', `Hello, ${result.user.name}!`, 'success');
    showAppPage();
    initApp();
  } else {
    showAuthError(result.error);
  }
}

function handleSignup() {
  const name = document.getElementById('signupName')?.value?.trim();
  const email = document.getElementById('signupEmail')?.value?.trim();
  const password = document.getElementById('signupPassword')?.value;
  if (!name || !email || !password) { showAuthError('Please fill in all fields.'); return; }

  const result = signup(name, email, password, selectedRole);
  if (result.success) {
    showToast('Welcome to CampusConnect! 🎉', 'Your account has been created.', 'success');
    showAppPage();
    initApp();
  } else {
    showAuthError(result.error);
  }
}

function quickLogin(role) {
  const user = AppState.users.find(u => u.role === role);
  if (!user) return;
  document.getElementById('loginEmail').value = user.email;
  document.getElementById('loginPassword').value = 'password123';
  handleLogin();
}

window.initAuth = initAuth;
window.login = login;
window.signup = signup;
window.logout = logout;
window.showAuthPage = showAuthPage;
window.showAppPage = showAppPage;
window.renderAuthPage = renderAuthPage;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.quickLogin = quickLogin;
window.selectRole = selectRole;
