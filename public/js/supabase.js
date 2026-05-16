window.App = window.App || {};

(function initSupabase(App) {
  const SUPABASE_URL = 'https://pybxpprdwxylxdmojppy.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5YnhwcHJkd3h5bHhkbW9qcHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDA3ODksImV4cCI6MjA5NDExNjc4OX0.g8KvklNTMnrrgUCXJUtfa98GZnL2dGyLR5KJ2tIsjGM';

  App.state = {
    currentUser: null,
    userSurahs: [],
    allSurahs: [],
    dailyProgress: [],
    serverDay: null
  };

  App.getToday = function getToday() {
    if (App.state.serverDay?.appDate) {
      return App.state.serverDay.appDate;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (!window.supabase) {
    document.body.textContent = 'Supabase client gagal dimuat. Periksa koneksi atau CDN.';
    return;
  }

  App.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})(window.App);
