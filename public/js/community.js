window.App = window.App || {};

(function initCommunity(App) {
  const ui = App.ui;
  const RECENT_PAGE_SIZE = 7;
  let detailRecentPage = 1;
  let activeUserDetail = null;

  function buildCommunityRows(profiles, progress) {
    const statsByUser = new Map();

    for (const item of progress) {
      if (!statsByUser.has(item.user_id)) {
        statsByUser.set(item.user_id, { completed: 0, total: 0, lastActive: null });
      }

      const stats = statsByUser.get(item.user_id);
      stats.total += 1;
      if (item.status === 'Selesai') stats.completed += 1;
      if (!stats.lastActive || item.progress_date > stats.lastActive) {
        stats.lastActive = item.progress_date;
      }
    }

    return profiles
      .filter((profile) => profile.id !== App.state.currentUser?.id)
      .map((profile) => {
        const stats = statsByUser.get(profile.id) || { completed: 0, total: 0, lastActive: null };
        return {
          id: profile.id,
          name: profile.full_name || 'Pengguna',
          completed: stats.completed,
          total: stats.total,
          progress: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
          lastActive: stats.lastActive
        };
      })
      .sort((a, b) => b.completed - a.completed);
  }

  function renderCommunity(rows) {
    const container = ui.get('communityList');
    ui.clear(container);

    if (rows.length === 0) {
      container.appendChild(ui.emptyState('Belum ada aktivitas dari pengguna lain.'));
      return;
    }

    const grid = ui.create('div', { className: 'community-grid' });
    for (const user of rows.slice(0, 20)) {
      const initial = user.name.charAt(0).toUpperCase() || 'P';
      const card = ui.create('button', {
        className: 'community-card',
        type: 'button',
        dataset: {
          userId: user.id,
          userName: user.name
        }
      }, [
        ui.create('div', { className: 'community-avatar', text: initial }),
        ui.create('div', { className: 'community-info' }, [
          ui.create('div', { className: 'community-name', text: user.name }),
          ui.create('div', { className: 'community-stats', text: `${user.completed} hari selesai | ${user.progress}%` }),
          ui.progressBar(user.progress)
        ])
      ]);

      grid.appendChild(card);
    }

    container.appendChild(grid);
  }

  async function loadCommunityPage() {
    if (!App.state.currentUser) return;

    ui.showLoading(true);
    try {
      const { profiles, progress } = await App.data.loadCommunityData();
      renderCommunity(buildCommunityRows(profiles, progress));
    } catch (error) {
      console.error('Community page error:', error);
      const container = ui.get('communityList');
      ui.clear(container);
      container.appendChild(ui.emptyState('Gagal memuat data community.'));
    } finally {
      ui.showLoading(false);
    }
  }

  function renderUserDetail(userName, userSurahs, progress) {
    const body = ui.get('userDetailBody');
    const completedDays = progress.filter((item) => item.status === 'Selesai').length;
    const holidayDays = progress.filter((item) => item.status === 'Libur').length;
    const totalDays = progress.length;
    const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    const stats = ui.create('div', {}, [
      statItem('Total Hari Aktif', `${totalDays} hari`),
      statItem('Total Selesai', `${completedDays} hari`),
      statItem('Total Libur', `${holidayDays} hari`),
      statItem('Completion Rate', `${completionRate}%`)
    ]);

    const surahSection = ui.create('div', { className: 'card' }, [
      ui.create('h2', { text: 'Progress per Surah' })
    ]);

    if (userSurahs.length === 0) {
      surahSection.appendChild(ui.create('p', { className: 'muted', text: 'Belum ada data surah.' }));
    } else {
      for (const userSurah of userSurahs) {
        const surahProgress = progress.filter((item) => item.surah_id === userSurah.surah_id);
        const completed = surahProgress.filter((item) => item.status === 'Selesai').length;
        const target = userSurah.target_days || 30;
        const percent = Math.min(100, Math.round((completed / target) * 100));

        surahSection.appendChild(ui.create('div', { className: 'recent-item' }, [
          ui.create('span', { text: userSurah.surahs?.name || 'Surah' }),
          ui.create('span', { text: `${completed}/${target} hari (${percent}%)` })
        ]));
        surahSection.appendChild(ui.progressBar(percent));
      }
    }

    const recentSection = ui.create('div', { className: 'card' }, [
      ui.create('h2', { text: 'Aktivitas Terakhir' })
    ]);
    const totalPages = Math.max(1, Math.ceil(progress.length / RECENT_PAGE_SIZE));
    detailRecentPage = Math.min(detailRecentPage, totalPages);
    const pageStart = (detailRecentPage - 1) * RECENT_PAGE_SIZE;
    const pageItems = progress.slice(pageStart, pageStart + RECENT_PAGE_SIZE);

    for (const item of pageItems) {
      recentSection.appendChild(ui.create('div', { className: 'recent-item' }, [
        ui.create('span', { text: ui.formatDate(item.progress_date) }),
        ui.create('span', { text: `${item.surahs?.name || 'Surah'} - ${item.status}` })
      ]));
    }

    if (progress.length === 0) {
      recentSection.appendChild(ui.create('p', { className: 'muted', text: 'Belum ada aktivitas.' }));
    }

    const pagination = ui.paginationControls({
      page: detailRecentPage,
      totalItems: progress.length,
      pageSize: RECENT_PAGE_SIZE,
      action: 'community-detail-recent-page'
    });
    if (pagination) recentSection.appendChild(pagination);

    ui.get('detailUserName').textContent = userName;
    ui.clear(body);
    body.append(stats, surahSection, recentSection);
  }

  function statItem(label, value) {
    return ui.create('div', { className: 'user-stat-item' }, [
      ui.create('span', { className: 'muted', text: label }),
      ui.create('strong', { text: value })
    ]);
  }

  async function showUserDetail(userId, userName) {
    const body = ui.get('userDetailBody');
    detailRecentPage = 1;
    activeUserDetail = null;
    ui.get('detailUserName').textContent = userName;
    ui.clear(body);
    body.appendChild(ui.create('div', { className: 'empty-state' }, [
      ui.create('div', { className: 'spinner' }),
      ui.create('p', { text: 'Memuat data pengguna...' })
    ]));
    App.modals.showModal('userDetailModal');

    try {
      const detail = await App.data.loadUserDetail(userId);
      activeUserDetail = {
        userName,
        userSurahs: detail.userSurahs,
        progress: detail.progress
      };
      renderUserDetail(userName, detail.userSurahs, detail.progress);
    } catch (error) {
      console.error('User detail error:', error);
      ui.clear(body);
      body.appendChild(ui.emptyState('Gagal memuat data pengguna.'));
    }
  }

  function setupCommunityEvents() {
    ui.get('communityList').addEventListener('click', (event) => {
      const card = event.target.closest('.community-card');
      if (!card) return;
      showUserDetail(card.dataset.userId, card.dataset.userName);
    });

    ui.get('userDetailBody').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action="community-detail-recent-page"]');
      if (!button || !activeUserDetail) return;

      detailRecentPage += button.dataset.direction === 'next' ? 1 : -1;
      renderUserDetail(
        activeUserDetail.userName,
        activeUserDetail.userSurahs,
        activeUserDetail.progress
      );
    });
  }

  App.community = {
    loadCommunityPage,
    setupCommunityEvents
  };
})(window.App);
