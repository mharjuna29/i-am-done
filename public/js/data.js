window.App = window.App || {};

(function initData(App) {
  const db = () => App.supabase;
  const state = () => App.state;

  async function loadUserData() {
    if (!state().currentUser) return;

    const [surahsRes, userSurahsRes, progressRes] = await Promise.all([
      db().from('surahs').select('*').order('name'),
      db().from('user_surahs').select('*').eq('user_id', state().currentUser.id),
      db().from('daily_progress').select('*, surahs(id, name)').eq('user_id', state().currentUser.id).order('progress_date', { ascending: false })
    ]);

    if (surahsRes.error) throw surahsRes.error;
    if (userSurahsRes.error) throw userSurahsRes.error;
    if (progressRes.error) throw progressRes.error;

    state().allSurahs = surahsRes.data || [];
    state().userSurahs = userSurahsRes.data || [];
    state().dailyProgress = progressRes.data || [];
  }

  async function loadServerDayInfo() {
    const { data, error } = await db().rpc('app_day_info');

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    state().serverDay = {
      serverNow: row.server_now,
      appDate: row.app_date,
      nextDayAt: row.next_day_at,
      timeZone: row.timezone || 'Asia/Jakarta'
    };

    return state().serverDay;
  }

  async function saveUserProfile(user, fullName, username) {
    if (!user) return;

    const displayName = fullName || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna';
    const profile = {
      id: user.id,
      full_name: displayName,
      email: user.email
    };

    const normalizedUsername = normalizeUsername(username || user.user_metadata?.username);
    if (normalizedUsername) {
      profile.username = normalizedUsername;
    }

    const { error } = await db().from('user_profiles').upsert(profile);

    if (error) {
      console.warn('Profile sync skipped:', error.message);
    }
  }

  function normalizeUsername(value) {
    return String(value || '').trim().toLowerCase();
  }

  async function resolveUsernameEmail(username) {
    const normalizedUsername = normalizeUsername(username);
    const { data, error } = await db().rpc('resolve_login_email', {
      login_identifier: normalizedUsername
    });

    if (error) throw error;
    if (!data) throw new Error('Username tidak ditemukan.');

    return data;
  }

  async function upsertProgress(surahId, status) {
    const today = state().serverDay?.appDate || (await loadServerDayInfo()).appDate;
    const { data: existing, error: findError } = await db()
      .from('daily_progress')
      .select('id')
      .eq('user_id', state().currentUser.id)
      .eq('surah_id', surahId)
      .eq('progress_date', today)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      const { error } = await db().from('daily_progress').update({ status }).eq('id', existing.id);
      if (error) throw error;
      return;
    }

    const { error } = await db().from('daily_progress').insert({
      user_id: state().currentUser.id,
      surah_id: surahId,
      progress_date: today,
      status
    });

    if (error) throw error;
  }

  async function deleteProgress(progressId) {
    const { error } = await db().from('daily_progress').delete().eq('id', progressId);
    if (error) throw error;
  }

  async function addUserSurah(surahId, targetDays) {
    const { error } = await db().from('user_surahs').insert({
      user_id: state().currentUser.id,
      surah_id: surahId,
      target_days: targetDays
    });

    if (error) throw error;
  }

  async function deleteUserSurah(userSurahId) {
    const { error } = await db().from('user_surahs').delete().eq('id', userSurahId);
    if (error) throw error;
  }

  async function loadCommunityData() {
    const [profilesRes, progressRes] = await Promise.all([
      db().from('user_profiles').select('id, full_name'),
      db().from('daily_progress').select('user_id, status, progress_date').order('progress_date', { ascending: false })
    ]);

    if (profilesRes.error) throw profilesRes.error;
    if (progressRes.error) throw progressRes.error;

    return {
      profiles: profilesRes.data || [],
      progress: progressRes.data || []
    };
  }

  async function loadUserDetail(userId) {
    const [userSurahsRes, progressRes] = await Promise.all([
      db().from('user_surahs').select('*, surahs(id, name)').eq('user_id', userId),
      db().from('daily_progress').select('*, surahs(id, name)').eq('user_id', userId).order('progress_date', { ascending: false })
    ]);

    if (userSurahsRes.error) throw userSurahsRes.error;
    if (progressRes.error) throw progressRes.error;

    return {
      userSurahs: userSurahsRes.data || [],
      progress: progressRes.data || []
    };
  }

  App.data = {
    loadUserData,
    loadServerDayInfo,
    saveUserProfile,
    resolveUsernameEmail,
    upsertProgress,
    deleteProgress,
    addUserSurah,
    deleteUserSurah,
    loadCommunityData,
    loadUserDetail
  };
})(window.App);
