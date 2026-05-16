window.App = window.App || {};

(function initAuth(App) {
  const ui = App.ui;

  async function checkSession() {
    try {
      const { data, error } = await App.supabase.auth.getSession();
      if (error) throw error;

      if (!data.session) {
        App.state.currentUser = null;
        return false;
      }

      App.state.currentUser = data.session.user;
      await App.data.saveUserProfile(data.session.user);
      await App.data.loadUserData();
      return true;
    } catch (error) {
      console.error('Session error:', error);
      ui.showToast('Gagal memeriksa sesi login.', 'error');
      return false;
    }
  }

  async function login(email, password) {
    ui.showLoading(true);
    try {
      const { data, error } = await App.supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      App.state.currentUser = data.user;
      await App.data.saveUserProfile(data.user);
      await App.data.loadUserData();
      ui.showToast('Login berhasil!', 'success');
      return true;
    } catch (error) {
      ui.showToast(error.message, 'error');
      return false;
    } finally {
      ui.showLoading(false);
    }
  }

  async function register(fullName, email, password) {
    ui.showLoading(true);
    try {
      const { data, error } = await App.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;
      await App.data.saveUserProfile(data.user, fullName);
      ui.showToast('Registrasi berhasil. Silakan login.', 'success');
      return true;
    } catch (error) {
      ui.showToast(error.message, 'error');
      return false;
    } finally {
      ui.showLoading(false);
    }
  }

  async function logout() {
    ui.showLoading(true);
    try {
      const { error } = await App.supabase.auth.signOut();
      if (error) throw error;

      App.state.currentUser = null;
      App.state.userSurahs = [];
      App.state.allSurahs = [];
      App.state.dailyProgress = [];
      App.state.serverDay = null;
      ui.showToast('Logout berhasil.', 'success');
      return true;
    } catch (error) {
      ui.showToast(error.message, 'error');
      return false;
    } finally {
      ui.showLoading(false);
    }
  }

  App.auth = {
    checkSession,
    login,
    register,
    logout
  };
})(window.App);
