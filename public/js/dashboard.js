window.App = window.App || {};

(function initDashboard(App) {
  const ui = App.ui;
  const RECENT_PAGE_SIZE = 7;
  let recentActivityPage = 1;

  function calculateStats() {
    const completed = App.state.dailyProgress.filter((item) => item.status === 'Selesai').length;
    const holiday = App.state.dailyProgress.filter((item) => item.status === 'Libur').length;
    const total = App.state.dailyProgress.length;

    return {
      completed,
      holiday,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
      activeSurahs: App.state.userSurahs.length
    };
  }

  function renderStatsGrid() {
    const stats = calculateStats();
    const grid = ui.get('statsGrid');

    ui.clear(grid);
    [
      ['Selesai', stats.completed],
      ['Libur', stats.holiday],
      ['Completion Rate', `${stats.completionRate}%`],
      ['Surah Aktif', stats.activeSurahs]
    ].forEach(([label, value]) => {
      grid.appendChild(ui.create('div', { className: 'stat-card' }, [
        ui.create('div', { className: 'stat-value', text: value }),
        ui.create('div', { className: 'stat-label', text: label })
      ]));
    });
  }

  function renderServerTime() {
    const serverDay = App.state.serverDay;
    const timeZone = serverDay?.timeZone || 'Asia/Jakarta';

    ui.get('serverNowText').textContent = serverDay
      ? `${ui.formatDateTime(serverDay.serverNow, timeZone)} ${timeZone}`
      : 'Tidak tersedia';

    ui.get('serverDateText').textContent = serverDay?.appDate
      ? ui.formatDate(serverDay.appDate)
      : '-';

    ui.get('nextDayText').textContent = serverDay?.nextDayAt
      ? ui.formatDateTime(serverDay.nextDayAt, timeZone)
      : '-';
  }

  function renderTodaySurahs() {
    const container = ui.get('todaySurahsList');
    const todayProgress = new Map();

    ui.clear(container);
    for (const progress of App.state.dailyProgress) {
      if (progress.progress_date === App.getToday()) {
        todayProgress.set(progress.surah_id, progress);
      }
    }

    if (App.state.userSurahs.length === 0) {
      container.appendChild(ui.emptyState('Belum ada surah. Buka My Surahs untuk menambahkan target hafalan.'));
      return;
    }

    for (const userSurah of App.state.userSurahs) {
      const surah = App.state.allSurahs.find((item) => item.id === userSurah.surah_id);
      if (!surah) continue;

      const progress = todayProgress.get(userSurah.surah_id);
      const info = ui.create('div', {}, [
        ui.create('strong', { text: surah.name }),
        ui.create('div', {}, [
          ui.create('small', { className: 'muted', text: `Target: ${userSurah.target_days} hari` })
        ])
      ]);

      const actions = ui.create('div', { className: 'today-surah-actions' });
      if (progress) {
        const statusClass = progress.status === 'Selesai' ? 'status-completed' : 'status-holiday';
        actions.append(
          ui.create('span', { className: `status-badge ${statusClass}`, text: progress.status }),
          ui.button('Batalkan', 'btn btn-outline', {
            action: 'undo-progress',
            surahId: userSurah.surah_id,
            progressId: progress.id
          })
        );
      } else {
        actions.append(
          ui.button('Selesai', 'btn btn-success', { action: 'update-progress', surahId: userSurah.surah_id, status: 'Selesai' }),
          ui.button('Libur', 'btn btn-warning', { action: 'update-progress', surahId: userSurah.surah_id, status: 'Libur' })
        );
      }

      container.appendChild(ui.create('div', { className: 'today-surah-item' }, [info, actions]));
    }
  }

  function renderRecentActivity() {
    const container = ui.get('recentActivity');
    const recent = [...App.state.dailyProgress]
      .sort((a, b) => new Date(b.progress_date) - new Date(a.progress_date));
    const totalPages = Math.max(1, Math.ceil(recent.length / RECENT_PAGE_SIZE));
    recentActivityPage = Math.min(recentActivityPage, totalPages);
    const pageStart = (recentActivityPage - 1) * RECENT_PAGE_SIZE;
    const pageItems = recent.slice(pageStart, pageStart + RECENT_PAGE_SIZE);

    ui.clear(container);
    if (recent.length === 0) {
      container.appendChild(ui.emptyState('Belum ada aktivitas.'));
      return;
    }

    for (const progress of pageItems) {
      const surah = App.state.allSurahs.find((item) => item.id === progress.surah_id);
      container.appendChild(ui.create('div', { className: 'activity-item' }, [
        ui.create('span', { text: ui.formatDate(progress.progress_date) }),
        ui.create('span', {}, [
          ui.create('strong', { text: surah?.name || 'Surah' }),
          ` - ${progress.status}`
        ])
      ]));
    }

    const pagination = ui.paginationControls({
      page: recentActivityPage,
      totalItems: recent.length,
      pageSize: RECENT_PAGE_SIZE,
      action: 'dashboard-recent-page'
    });
    if (pagination) container.appendChild(pagination);
  }

  async function loadDashboard() {
    if (!App.state.currentUser) return;

    ui.showLoading(true);
    try {
      await App.data.loadServerDayInfo();
      await App.data.loadUserData();
      renderServerTime();
      renderTodaySurahs();
      renderStatsGrid();
      renderRecentActivity();
    } catch (error) {
      ui.showToast(error.message, 'error');
    } finally {
      ui.showLoading(false);
    }
  }

  async function updateProgress(surahId, status) {
    const surah = App.state.allSurahs.find((item) => item.id === surahId);
    const confirmed = await App.modals.showConfirmModal({
      icon: status === 'Selesai' ? 'OK' : 'i',
      title: status === 'Selesai' ? 'Konfirmasi Selesai' : 'Konfirmasi Libur',
      message: [
        ui.create('p', {}, [
          'Tandai ',
          ui.create('strong', { text: surah?.name || 'surah ini' }),
          ` sebagai ${status} untuk hari ini?`
        ])
      ],
      type: status === 'Selesai' ? 'success' : 'warning',
      confirmText: 'Ya, Simpan'
    });

    if (!confirmed) return;

    ui.showLoading(true);
    try {
      await App.data.upsertProgress(surahId, status);
      await loadDashboard();
      ui.showToast(`Progress disimpan: ${status}`, 'success');
    } catch (error) {
      ui.showToast(error.message, 'error');
    } finally {
      ui.showLoading(false);
    }
  }

  async function undoProgress(surahId, progressId) {
    const surah = App.state.allSurahs.find((item) => item.id === surahId);
    const confirmed = await App.modals.showConfirmModal({
      icon: '!',
      title: 'Batalkan Progress',
      message: [
        ui.create('p', {}, [
          'Hapus catatan progress hari ini untuk ',
          ui.create('strong', { text: surah?.name || 'surah ini' }),
          '?'
        ])
      ],
      type: 'danger',
      confirmText: 'Ya, Batalkan'
    });

    if (!confirmed) return;

    ui.showLoading(true);
    try {
      await App.data.deleteProgress(progressId);
      await loadDashboard();
      ui.showToast('Progress dibatalkan.', 'success');
    } catch (error) {
      ui.showToast(error.message, 'error');
    } finally {
      ui.showLoading(false);
    }
  }

  function setupDashboardEvents() {
    ui.get('todaySurahsList').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;

      if (button.dataset.action === 'update-progress') {
        updateProgress(button.dataset.surahId, button.dataset.status);
      }

      if (button.dataset.action === 'undo-progress') {
        undoProgress(button.dataset.surahId, button.dataset.progressId);
      }
    });

    ui.get('recentActivity').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action="dashboard-recent-page"]');
      if (!button) return;

      recentActivityPage += button.dataset.direction === 'next' ? 1 : -1;
      renderRecentActivity();
    });
  }

  App.dashboard = {
    loadDashboard,
    setupDashboardEvents
  };
})(window.App);
