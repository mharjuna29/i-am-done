// ==================== APP INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize theme
  initTheme();
  
  // Check authentication
  const isAuthenticated = await checkSession();
  
  if (isAuthenticated) {
    showApp();
    await loadDashboard();
  } else {
    showAuth();
  }
  
  // Setup event listeners
  setupEventListeners();
});

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }
}

function showApp() {
  document.getElementById('authPages').style.display = 'none';
  document.getElementById('userMenu').style.display = 'block';
  document.getElementById('loginBtn').style.display = 'none';
  
  // Update user info in dropdown
  if (currentUser) {
    const name = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User';
    document.getElementById('userNameDisplay').textContent = name;
    document.getElementById('userEmailDisplay').textContent = currentUser.email;
    document.getElementById('userInitials').textContent = name.charAt(0).toUpperCase();
  }
  
  // Show default page
  navigateTo('dashboard');
}

function showAuth() {
  document.getElementById('authPages').style.display = 'block';
  document.getElementById('userMenu').style.display = 'none';
  document.getElementById('loginBtn').style.display = 'block';
  document.getElementById('dashboardPage').style.display = 'none';
  document.getElementById('surahsPage').style.display = 'none';
  document.getElementById('statsPage').style.display = 'none';
  
  showLoginPage();
}

function showLoginPage() {
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('registerPage').style.display = 'none';
}

function showRegisterPage() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('registerPage').style.display = 'flex';
}

function navigateTo(page) {
  // Hide all pages
  document.getElementById('dashboardPage').style.display = 'none';
  document.getElementById('surahsPage').style.display = 'none';
  document.getElementById('statsPage').style.display = 'none';
  
  // Show selected page
  document.getElementById(`${page}Page`).style.display = 'block';
  
  // Update active nav state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.page === page) {
      item.classList.add('active');
    }
  });
  
  // Load page data
  if (page === 'dashboard') {
    loadDashboard();
  } else if (page === 'surahs') {
    loadSurahsPage();
  } else if (page === 'stats') {
    loadStatsPage();
  }
}

function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });
  
  // Auth forms
  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const success = await login(email, password);
    if (success) {
      showApp();
      await loadDashboard();
    }
  });
  
  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const success = await register(name, email, password);
    if (success) {
      showApp();
      await loadDashboard();
    }
  });
  
  document.getElementById('showRegister')?.addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterPage();
  });
  
  document.getElementById('showLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    showLoginPage();
  });
  
  document.getElementById('loginBtn')?.addEventListener('click', () => {
    showAuth();
  });
  
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await logout();
    showAuth();
  });
  
  // Add Surah Modal
  document.getElementById('addSurahBtn')?.addEventListener('click', () => {
    populateSurahSelect();
    document.getElementById('addSurahModal').classList.add('active');
  });
  
  document.getElementById('closeModalBtn')?.addEventListener('click', () => {
    document.getElementById('addSurahModal').classList.remove('active');
  });
  
  document.getElementById('confirmAddSurahBtn')?.addEventListener('click', async () => {
    const surahId = document.getElementById('newSurahId').value;
    const targetDays = parseInt(document.getElementById('newTargetDays').value);
    
    if (surahId && targetDays >= 30 && targetDays <= 365) {
      await addSurah(surahId, targetDays);
      document.getElementById('addSurahModal').classList.remove('active');
    } else {
      showToast('Please select a surah and valid target days (30-365)', 'error');
    }
  });
  
  // Close modal on outside click
  document.getElementById('addSurahModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('addSurahModal')) {
      document.getElementById('addSurahModal').classList.remove('active');
    }
  });
}

// Expose functions to global scope for HTML onclick
window.navigateTo = navigateTo;
window.updateProgress = updateProgress;
window.deleteSurah = deleteSurah;
window.addSurah = addSurah;