// ==================== AUTHENTICATION FUNCTIONS ====================
async function checkSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Session check error:', error);
    return false;
  }
  
  if (session) {
    currentSession = session;
    currentUser = session.user;
    await loadUserData();
    return true;
  }
  
  return false;
}

async function login(email, password) {
  showLoading(true);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });
  
  showLoading(false);
  
  if (error) {
    showToast(error.message, 'error');
    return false;
  }
  
  currentSession = data.session;
  currentUser = data.user;
  await loadUserData();
  showToast(`Welcome back, ${currentUser.user_metadata?.full_name || currentUser.email}!`, 'success');
  return true;
}

async function register(fullName, email, password) {
  showLoading(true);
  
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });
  
  showLoading(false);
  
  if (error) {
    showToast(error.message, 'error');
    return false;
  }
  
  if (data.user) {
    showToast('Registration successful! Please check your email for confirmation.', 'success');
    // Auto login after registration
    return await login(email, password);
  }
  
  return false;
}

async function logout() {
  showLoading(true);
  
  const { error } = await supabase.auth.signOut();
  
  showLoading(false);
  
  if (error) {
    showToast(error.message, 'error');
    return false;
  }
  
  currentUser = null;
  currentSession = null;
  userSurahs = [];
  allSurahs = [];
  dailyProgress = [];
  
  showToast('Logged out successfully', 'success');
  return true;
}

// ==================== LOAD USER DATA ====================
async function loadUserData() {
  if (!currentUser) return;
  
  showLoading(true);
  
  // Load all available surahs
  const { data: surahsData, error: surahsError } = await supabase
    .from('surahs')
    .select('*')
    .order('name');
  
  if (surahsError) {
    console.error('Error loading surahs:', surahsError);
  } else {
    allSurahs = surahsData;
  }
  
  // Load user's selected surahs with progress
  const { data: userSurahsData, error: userSurahsError } = await supabase
    .from('user_surahs')
    .select('*')
    .eq('user_id', currentUser.id);
  
  if (userSurahsError) {
    console.error('Error loading user surahs:', userSurahsError);
  } else {
    userSurahs = userSurahsData;
  }
  
  // Load daily progress for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: progressData, error: progressError } = await supabase
    .from('daily_progress')
    .select('*, surahs(name)')
    .eq('user_id', currentUser.id)
    .gte('progress_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('progress_date', { ascending: false });
  
  if (progressError) {
    console.error('Error loading progress:', progressError);
  } else {
    dailyProgress = progressData;
  }
  
  showLoading(false);
}

// ==================== UPDATE PROFILE ====================
async function updateUserProfile(updates) {
  const { data, error } = await supabase.auth.updateUser({
    data: updates
  });
  
  if (error) {
    showToast(error.message, 'error');
    return false;
  }
  
  if (data.user) {
    currentUser = data.user;
    showToast('Profile updated successfully', 'success');
    return true;
  }
  
  return false;
}