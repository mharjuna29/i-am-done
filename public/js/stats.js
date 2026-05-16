window.App = window.App || {};

(function initStats(App) {
  const ui = App.ui;

  async function loadStatsPage() {
    if (!App.state.currentUser) return;

    const container = ui.get('statsDetailed');
    ui.showLoading(true);
    try {
      await App.data.loadUserData();
      ui.clear(container);

      if (App.state.userSurahs.length === 0) {
        container.appendChild(ui.emptyState('Tambah surah untuk melihat statistik.'));
        return;
      }

      const grid = ui.create('div', { className: 'stats-grid' });
      for (const userSurah of App.state.userSurahs) {
        const surah = App.state.allSurahs.find((item) => item.id === userSurah.surah_id);
        if (!surah) continue;

        const completed = App.state.dailyProgress.filter((item) => item.surah_id === userSurah.surah_id && item.status === 'Selesai').length;
        const percent = userSurah.target_days > 0 ? Math.round((completed / userSurah.target_days) * 100) : 0;

        grid.appendChild(ui.create('div', { className: 'stat-card' }, [
          ui.create('div', { className: 'stat-value', text: `${Math.min(100, percent)}%` }),
          ui.create('div', { className: 'stat-label', text: surah.name }),
          ui.create('div', { className: 'small muted', text: `${completed}/${userSurah.target_days} hari` })
        ]));
      }

      container.appendChild(grid);
    } catch (error) {
      ui.showToast(error.message, 'error');
    } finally {
      ui.showLoading(false);
    }
  }

  App.stats = {
    loadStatsPage
  };
})(window.App);
