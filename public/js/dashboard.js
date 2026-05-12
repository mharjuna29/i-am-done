// ==================== DASHBOARD FUNCTIONS ====================
async function loadDashboard() {
  if (!currentUser) return;
  
  showLoading(true);
  await loadUserData(); // Refresh data
  
  // Calculate statistics
  const stats = calculateStatistics();
  renderStatsGrid(stats);
  
  // Render today's surahs
  await renderTodaySurahs();
  
  // Render recent activity
  renderRecentActivity();
  
  showLoading(false);
}

function calculateStatistics() {
  const stats = {
    totalCompleted: 0,
    totalHoliday: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalDays: 0,
    completionRate: 0
  };
  
  // Group progress by surah
  const surahProgress = {};
  
  for (const progress of dailyProgress) {
    if (progress.status === 'Selesai') {
      stats.totalCompleted++;
    } else if (progress.status === 'Libur') {
      stats.totalHoliday++;
    }
    
    if (!surahProgress[progress.surah_id]) {
      surahProgress[progress.surah_id] = { completed: 0, total: 0 };
    }
    surahProgress[progress.surah_id].total++;
    if (progress.status === 'Selesai') {
      surahProgress[progress.surah_id].completed++;
    }
  }
  
  stats.totalDays = dailyProgress.length;
  stats.completionRate = stats.totalDays > 0 
    ? Math.round((stats.totalCompleted / stats.totalDays) * 100) 
    : 0;
  
  // Calculate streak (simplified - check consecutive days)
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const sortedProgress = [...dailyProgress].sort((a, b) => 
    new Date(b.progress_date) - new Date(a.progress_date)
  );
  
  for (let i = 0; i < sortedProgress.length; i++) {
    if (sortedProgress[i].status === 'Selesai') {
      streak++;
    } else if (sortedProgress[i].status !== 'Libur') {
      break;
    }
  }
  stats.currentStreak = streak;
  stats.bestStreak = Math.max(streak, userSurahs.reduce((max, s) => Math.max(max, s.best_streak), 0));
  
  return stats;
}

function renderStatsGrid(stats) {
  const grid = document.getElementById('statsGrid');
  if (!grid) return;
  
  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${stats.totalCompleted}</div>
      <div class="stat-label">Total Completed</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.totalHoliday}</div>
      <div class="stat-label">Holiday Days</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.currentStreak}</div>
      <div class="stat-label">Current Streak 🔥</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.bestStreak}</div>
      <div class="stat-label">Best Streak 🏆</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.completionRate}%</div>
      <div class="stat-label">Completion Rate</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${userSurahs.length}</div>
      <div class="stat-label">Active Surahs</div>
    </div>
  `;
}

async function renderTodaySurahs() {
  const container = document.getElementById('todaySurahsList');
  if (!container) return;
  
  const today = new Date().toISOString().split('T')[0];
  
  // Get today's progress status for each surah
  const todayProgress = {};
  for (const progress of dailyProgress) {
    if (progress.progress_date === today) {
      todayProgress[progress.surah_id] = progress.status;
    }
  }
  
  if (userSurahs.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2rem;">
        <p>You haven't added any surahs yet.</p>
        <button class="btn btn-primary" onclick="navigateTo('surahs')">Add Your First Surah</button>
      </div>
    `;
    return;
  }
  
  let html = '';
  for (const userSurah of userSurahs) {
    const surah = allSurahs.find(s => s.id === userSurah.surah_id);
    if (!surah) continue;
    
    const status = todayProgress[userSurah.surah_id];
    const isCompleted = status === 'Selesai';
    const isHoliday = status === 'Libur';
    
    html += `
      <div class="today-surah-item">
        <div class="today-surah-info">
          <h4>📖 ${surah.name}</h4>
          <p>Target: ${userSurah.target_days} days</p>
        </div>
        <div class="today-surah-actions">
          ${!status ? `
            <button class="btn btn-success" onclick="updateProgress('${userSurah.surah_id}', 'Selesai')">✅ Selesai</button>
            <button class="btn btn-outline" onclick="updateProgress('${userSurah.surah_id}', 'Libur')">🌙 Libur</button>
          ` : `
            <span class="status-badge ${isCompleted ? 'status-completed' : 'status-holiday'}">
              ${isCompleted ? '✅ Completed Today' : '🌙 Holiday Today'}
            </span>
          `}
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

function renderRecentActivity() {
  const container = document.getElementById('recentActivity');
  if (!container) return;
  
  if (dailyProgress.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">No activity yet. Start your memorization today!</div>';
    return;
  }
  
  let html = '';
  for (const progress of dailyProgress.slice(0, 10)) {
    const surah = allSurahs.find(s => s.id === progress.surah_id);
    const statusText = progress.status === 'Selesai' ? '✅ Completed' : '🌙 Holiday';
    const statusClass = progress.status === 'Selesai' ? 'status-completed' : 'status-holiday';
    
    html += `
      <div class="activity-item">
        <div>
          <span class="activity-date">${formatDate(progress.progress_date)}</span>
          <span style="margin-left: 0.5rem; font-size: 0.875rem;">${surah?.name || 'Unknown'}</span>
        </div>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

// ==================== PROGRESS UPDATE ====================
async function updateProgress(surahId, status) {
  showLoading(true);
  
  const today = new Date().toISOString().split('T')[0];
  
  // Check if progress already exists
  const existing = dailyProgress.find(p => 
    p.surah_id === surahId && p.progress_date === today
  );
  
  let result;
  if (existing) {
    result = await supabase
      .from('daily_progress')
      .update({ status: status, updated_at: new Date() })
      .eq('id', existing.id);
  } else {
    result = await supabase
      .from('daily_progress')
      .insert({
        user_id: currentUser.id,
        surah_id: surahId,
        progress_date: today,
        status: status
      });
  }
  
  if (result.error) {
    showToast(result.error.message, 'error');
  } else {
    showToast(`Progress updated: ${status}`, 'success');
    await loadDashboard(); // Refresh dashboard
  }
  
  showLoading(false);
}

// ==================== SURAH MANAGEMENT ====================
async function loadSurahsPage() {
  if (!currentUser) return;
  
  showLoading(true);
  await loadUserData();
  renderSurahsList();
  populateSurahSelect();
  showLoading(false);
}

function renderSurahsList() {
  const container = document.getElementById('surahsList');
  if (!container) return;
  
  if (userSurahs.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 3rem;">
        <p style="margin-bottom: 1rem; color: var(--text-muted);">You haven't added any surahs yet.</p>
        <button class="btn btn-primary" onclick="document.getElementById('addSurahBtn').click()">Add Your First Surah</button>
      </div>
    `;
    return;
  }
  
  let html = '';
  for (const userSurah of userSurahs) {
    const surah = allSurahs.find(s => s.id === userSurah.surah_id);
    if (!surah) continue;
    
    // Calculate progress for this surah
    const surahProgress = dailyProgress.filter(p => p.surah_id === userSurah.surah_id);
    const completed = surahProgress.filter(p => p.status === 'Selesai').length;
    const progressPercent = Math.min(100, Math.round((completed / userSurah.target_days) * 100));
    
    html += `
      <div class="surah-card">
        <div class="surah-header">
          <span class="surah-name">📖 ${surah.name}</span>
          <button class="btn btn-outline" style="padding: 0.25rem 0.5rem;" onclick="deleteSurah('${userSurah.id}')">🗑️</button>
        </div>
        <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 1rem;">${surah.description || ''}</p>
        <div class="surah-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
          </div>
        </div>
        <div class="surah-stats">
          <span>🎯 Target: ${userSurah.target_days} days</span>
          <span>✅ Completed: ${completed}/${userSurah.target_days}</span>
        </div>
        <div class="surah-stats">
          <span>🔥 Streak: ${userSurah.current_streak} days</span>
          <span>🏆 Best: ${userSurah.best_streak} days</span>
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

function populateSurahSelect() {
  const select = document.getElementById('newSurahId');
  if (!select) return;
  
  // Get surahs not already added by user
  const userSurahIds = userSurahs.map(us => us.surah_id);
  const availableSurahs = allSurahs.filter(s => !userSurahIds.includes(s.id));
  
  if (availableSurahs.length === 0) {
    select.innerHTML = '<option disabled>All surahs already added</option>';
    document.getElementById('confirmAddSurahBtn').disabled = true;
    return;
  }
  
  select.innerHTML = availableSurahs.map(s => 
    `<option value="${s.id}">${s.name}</option>`
  ).join('');
  
  document.getElementById('confirmAddSurahBtn').disabled = false;
}

async function addSurah(surahId, targetDays) {
  showLoading(true);
  
  const { data, error } = await supabase
    .from('user_surahs')
    .insert({
      user_id: currentUser.id,
      surah_id: surahId,
      target_days: targetDays
    })
    .select();
  
  if (error) {
    showToast(error.message, 'error');
    showLoading(false);
    return false;
  }
  
  showToast('Surah added successfully!', 'success');
  await loadUserData();
  renderSurahsList();
  showLoading(false);
  return true;
}

async function deleteSurah(userSurahId) {
  if (!confirm('Are you sure you want to remove this surah? All progress will be lost.')) return;
  
  showLoading(true);
  
  const { error } = await supabase
    .from('user_surahs')
    .delete()
    .eq('id', userSurahId);
  
  if (error) {
    showToast(error.message, 'error');
  } else {
    showToast('Surah removed', 'success');
    await loadUserData();
    renderSurahsList();
    if (document.getElementById('dashboardPage').style.display !== 'none') {
      await loadDashboard();
    }
  }
  
  showLoading(false);
}

// ==================== STATISTICS PAGE ====================
async function loadStatsPage() {
  if (!currentUser) return;
  
  showLoading(true);
  await loadUserData();
  renderDetailedStats();
  showLoading(false);
}

function renderDetailedStats() {
  const container = document.getElementById('statsDetailed');
  if (!container) return;
  
  // Group by surah
  const surahStats = {};
  for (const surah of allSurahs) {
    surahStats[surah.id] = {
      name: surah.name,
      description: surah.description,
      completed: 0,
      holiday: 0,
      total: 0,
      dates: []
    };
  }
  
  for (const progress of dailyProgress) {
    if (surahStats[progress.surah_id]) {
      surahStats[progress.surah_id].total++;
      if (progress.status === 'Selesai') {
        surahStats[progress.surah_id].completed++;
      } else if (progress.status === 'Libur') {
        surahStats[progress.surah_id].holiday++;
      }
      surahStats[progress.surah_id].dates.push(progress.progress_date);
    }
  }
  
  let html = '<div class="stats-detailed-grid" style="display: grid; gap: 1.5rem;">';
  
  for (const [id, stats] of Object.entries(surahStats)) {
    const userSurah = userSurahs.find(us => us.surah_id === id);
    const completedPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    
    html += `
      <div class="card">
        <h3 style="margin-bottom: 0.5rem;">📖 ${stats.name}</h3>
        <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 1rem;">${stats.description || ''}</p>
        
        <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 1rem;">
          <div class="stat-card">
            <div class="stat-value">${stats.completed}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.holiday}</div>
            <div class="stat-label">Holiday</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${completedPercent}%</div>
            <div class="stat-label">Completion</div>
          </div>
        </div>
        
        ${userSurah ? `
          <div class="surah-stats">
            <span>🎯 Target: ${userSurah.target_days} days</span>
            <span>🔥 Current Streak: ${userSurah.current_streak}</span>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  html += '</div>';
  container.innerHTML = html;
}