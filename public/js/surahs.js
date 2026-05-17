window.App = window.App || {};

(function initSurahs(App) {
  const ui = App.ui;

  function renderSurahsList() {
    const container = ui.get('surahsList');
    ui.clear(container);

    if (App.state.userSurahs.length === 0) {
      container.appendChild(ui.emptyState('Anda belum menambahkan surah apapun.'));
      return;
    }

    for (const userSurah of App.state.userSurahs) {
      const surah = App.state.allSurahs.find((item) => item.id === userSurah.surah_id);
      if (!surah) continue;

      const completed = App.state.dailyProgress.filter((item) => item.surah_id === userSurah.surah_id && item.status === 'Selesai').length;
      const percent = userSurah.target_days > 0 ? Math.min(100, Math.round((completed / userSurah.target_days) * 100)) : 0;

      container.appendChild(ui.create('article', { className: 'surah-card' }, [
        ui.create('div', { className: 'surah-name', text: surah.name }),
        ui.create('p', { className: 'muted small', text: surah.description || 'Surat pilihan untuk dihafal' }),
        ui.progressBar(percent),
        ui.create('div', { className: 'activity-item small' }, [
          ui.create('span', { text: `Target: ${userSurah.target_days} hari` }),
          ui.create('span', { text: `Selesai: ${completed}` })
        ]),
        ui.button('Hapus Surah', 'btn btn-outline btn-block', {
          action: 'delete-surah',
          userSurahId: userSurah.id,
          surahId: userSurah.surah_id,
          surahName: surah.name
        })
      ]));
    }
  }

  async function loadSurahsPage() {
    if (!App.state.currentUser) return;

    ui.showLoading(true);
    try {
      await App.data.loadUserData();
      renderSurahsList();
    } catch (error) {
      ui.showToast(error.message, 'error');
    } finally {
      ui.showLoading(false);
    }
  }

  async function addSurah(surahId, targetDays) {
    ui.showLoading(true);
    try {
      await App.data.addUserSurah(surahId, targetDays);
      await App.data.loadUserData();
      renderSurahsList();
      await App.dashboard.loadDashboard();
      ui.showToast('Surah berhasil ditambahkan.', 'success');
    } catch (error) {
      ui.showToast(error.message, 'error');
    } finally {
      ui.showLoading(false);
    }
  }

  async function deleteSurah(userSurahId, surahId, surahName) {
    const confirmed = await App.modals.showConfirmModal({
      icon: '!',
      title: 'Hapus Surah',
      message: [
        ui.create('p', {}, [
          'Hapus ',
          ui.create('strong', { text: surahName }),
          ' dari daftar hafalan beserta semua progress-nya?'
        ])
      ],
      type: 'danger',
      confirmText: 'Ya, Hapus'
    });

    if (!confirmed) return;

    ui.showLoading(true);
    try {
      await App.data.deleteUserSurah(userSurahId, surahId);
      await App.data.loadUserData();
      renderSurahsList();
      ui.showToast(`${surahName} dihapus.`, 'success');
    } catch (error) {
      ui.showToast(error.message, 'error');
    } finally {
      ui.showLoading(false);
    }
  }

  function setupSurahEvents() {
    ui.get('addSurahBtn').addEventListener('click', () => App.modals.showAddSurahModal());
    ui.get('surahsList').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action="delete-surah"]');
      if (!button) return;
      deleteSurah(button.dataset.userSurahId, button.dataset.surahId, button.dataset.surahName);
    });
  }

  App.surahs = {
    loadSurahsPage,
    addSurah,
    setupSurahEvents
  };
})(window.App);
