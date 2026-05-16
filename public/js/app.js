window.App = window.App || {};

(function initApp(App) {
  const ui = App.ui;
  const APP_VERSION = '1.0.0';

  App.version = APP_VERSION;

  function applyTheme(theme) {
    const nextTheme = theme === 'light' ? 'light' : 'dark';
    const toggle = ui.get('themeToggle');
    const toggleText = ui.get('themeToggleText');
    const themeColor = document.querySelector('meta[name="theme-color"]');

    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('theme', nextTheme);

    if (toggle) {
      toggle.setAttribute('aria-pressed', String(nextTheme === 'light'));
      toggle.setAttribute('aria-label', nextTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    }

    if (toggleText) {
      toggleText.textContent = nextTheme === 'light' ? 'Light' : 'Dark';
    }

    if (themeColor) {
      themeColor.setAttribute('content', nextTheme === 'light' ? '#f5f7fb' : '#0a0a0a');
    }
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
    applyTheme(savedTheme || (prefersLight ? 'light' : 'dark'));
  }

  function showApp() {
    ui.setHidden('authPages', true);
    ui.setHidden('navMenu', false);
    ui.setHidden('loginBtn', true);
    ui.setHidden('userInfo', false);

    const name = App.state.currentUser?.user_metadata?.full_name || App.state.currentUser?.email?.split('@')[0] || 'User';
    ui.get('userName').textContent = name;
  }

  function showAuth() {
    ui.setHidden('authPages', false);
    ui.setHidden('loginPage', false);
    ui.setHidden('registerPage', true);
    ui.setHidden('navMenu', true);
    ui.setHidden('loginBtn', true);
    ui.setHidden('userInfo', true);

    for (const page of ['dashboardPage', 'surahsPage', 'communityPage', 'statsPage']) {
      ui.setHidden(page, true);
    }
  }

  function showRegisterPage() {
    ui.setHidden('loginPage', true);
    ui.setHidden('registerPage', false);
  }

  function showLoginPage() {
    ui.setHidden('loginPage', false);
    ui.setHidden('registerPage', true);
  }

  async function navigateTo(page) {
    const allowedPages = ['dashboard', 'surahs', 'community', 'stats'];
    const nextPage = allowedPages.includes(page) ? page : 'dashboard';

    localStorage.setItem('activePage', nextPage);
    ui.setPageVisible(nextPage);

    if (nextPage === 'dashboard') await App.dashboard.loadDashboard();
    if (nextPage === 'surahs') await App.surahs.loadSurahsPage();
    if (nextPage === 'community') await App.community.loadCommunityPage();
    if (nextPage === 'stats') await App.stats.loadStatsPage();
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
    });
  }

  function renderFooterMeta() {
    const year = new Date().getFullYear();
    const yearElement = ui.get('copyrightYear');
    const versionElement = ui.get('appVersion');

    if (yearElement) yearElement.textContent = year;
    if (versionElement) versionElement.textContent = APP_VERSION;
  }

  function setupEvents() {
    document.querySelectorAll('.nav-item').forEach((button) => {
      button.addEventListener('click', () => navigateTo(button.dataset.page));
    });

    ui.get('logoHomeBtn').addEventListener('click', () => {
      if (App.state.currentUser) {
        navigateTo('dashboard');
      }
    });

    ui.get('loginForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const success = await App.auth.login(ui.get('loginUsername').value, ui.get('loginPassword').value);
      if (success) {
        showApp();
        await navigateTo('dashboard');
      }
    });

    ui.get('registerForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const success = await App.auth.register(
        ui.get('regName').value,
        ui.get('regUsername').value,
        ui.get('regEmail').value,
        ui.get('regPassword').value
      );

      if (success) showLoginPage();
    });

    ui.get('showRegister').addEventListener('click', (event) => {
      event.preventDefault();
      showRegisterPage();
    });

    ui.get('showLogin').addEventListener('click', (event) => {
      event.preventDefault();
      showLoginPage();
    });

    ui.get('loginBtn').addEventListener('click', showAuth);
    ui.get('logoutBtn').addEventListener('click', async () => {
      const success = await App.auth.logout();
      if (success) {
        localStorage.removeItem('activePage');
        showAuth();
      }
    });

    ui.get('themeToggle').addEventListener('click', () => {
      const currentTheme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
      applyTheme(currentTheme === 'light' ? 'dark' : 'light');
    });

    App.modals.setupModalEvents();
    App.dashboard.setupDashboardEvents();
    App.surahs.setupSurahEvents();
    App.community.setupCommunityEvents();
  }

  document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    setupEvents();
    renderFooterMeta();
    registerServiceWorker();

    const authenticated = await App.auth.checkSession();

    if (authenticated) {
      showApp();
      await navigateTo(localStorage.getItem('activePage') || 'dashboard');
    } else {
      showAuth();
    }

    ui.showLoading(false);
  });

  App.app = {
    navigateTo,
    showApp,
    showAuth
  };
})(window.App);
