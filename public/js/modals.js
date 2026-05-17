window.App = window.App || {};

(function initModals(App) {
  const ui = App.ui;

  function showModal(id) {
    ui.setHidden(id, false);
  }

  function hideModal(id) {
    ui.setHidden(id, true);
  }

  function setMessage(container, message) {
    ui.clear(container);

    if (Array.isArray(message)) {
      container.append(...message);
    } else {
      container.append(ui.create('p', { text: message || '' }));
    }
  }

  function showConfirmModal(options) {
    return new Promise((resolve) => {
      const modal = ui.get('confirmModal');
      const icon = ui.get('modalIcon');
      const title = ui.get('modalTitle');
      const message = ui.get('modalMessage');
      const confirmBtn = ui.get('modalConfirmBtn');
      const cancelBtn = ui.get('modalCancelBtn');

      icon.textContent = options.icon || '!';
      title.textContent = options.title || 'Konfirmasi';
      setMessage(message, options.message);

      confirmBtn.className = `btn btn-${options.type === 'danger' ? 'danger' : options.type === 'success' ? 'success' : 'primary'}`;
      confirmBtn.textContent = options.confirmText || 'Ya, Lanjutkan';

      const cleanup = (answer) => {
        hideModal('confirmModal');
        confirmBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
        modal.removeEventListener('click', onOutside);
        resolve(answer);
      };

      const onConfirm = () => cleanup(true);
      const onCancel = () => cleanup(false);
      const onOutside = (event) => {
        if (event.target === modal) cleanup(false);
      };

      confirmBtn.addEventListener('click', onConfirm);
      cancelBtn.addEventListener('click', onCancel);
      modal.addEventListener('click', onOutside);
      showModal('confirmModal');
    });
  }

  function populateSurahSelect() {
    const select = ui.get('newSurahSelect');
    const surahById = new Map(App.state.allSurahs.map((surah) => [surah.id, surah]));
    const userSurahNames = new Set(
      App.state.userSurahs
        .map((item) => surahById.get(item.surah_id)?.name)
        .filter(Boolean)
        .map(normalizeSurahName)
    );
    const uniqueSurahs = uniqueBySurahName(App.state.allSurahs);
    const availableSurahs = uniqueSurahs.filter((surah) => !userSurahNames.has(normalizeSurahName(surah.name)));

    ui.clear(select);
    select.appendChild(ui.create('option', { text: '-- Pilih Surah --', value: '' }));

    for (const surah of availableSurahs) {
      const option = ui.create('option', {
        text: surah.name,
        value: surah.id,
        dataset: {
          description: surah.description || 'Surat pilihan untuk dihafal'
        }
      });
      select.appendChild(option);
    }

    return availableSurahs.length;
  }

  function normalizeSurahName(name) {
    return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function uniqueBySurahName(surahs) {
    const seenNames = new Set();

    return [...surahs]
      .filter((surah) => surah?.id && surah?.name)
      .sort((a, b) => a.name.localeCompare(b.name, 'id'))
      .filter((surah) => {
        const key = normalizeSurahName(surah.name);
        if (seenNames.has(key)) return false;
        seenNames.add(key);
        return true;
      });
  }

  function updateSurahPreview() {
    const select = ui.get('newSurahSelect');
    const preview = ui.get('surahPreview');
    const previewName = ui.get('previewName');
    const previewDescription = ui.get('previewDescription');
    const selected = select.options[select.selectedIndex];

    if (!select.value || !selected) {
      ui.setHidden(preview, true);
      return;
    }

    previewName.textContent = selected.textContent;
    previewDescription.textContent = selected.dataset.description || '';
    ui.setHidden(preview, false);
  }

  function showAddSurahModal() {
    const availableCount = populateSurahSelect();

    if (availableCount === 0) {
      ui.showToast('Anda sudah menambahkan semua surah yang tersedia.', 'info');
      return;
    }

    ui.get('targetDaysSlider').value = '30';
    ui.get('targetDaysValue').textContent = '30 hari';
    ui.setHidden('surahPreview', true);
    showModal('addSurahModal');
  }

  function setupModalEvents() {
    ui.get('newSurahSelect').addEventListener('change', updateSurahPreview);
    ui.get('targetDaysSlider').addEventListener('input', (event) => {
      ui.get('targetDaysValue').textContent = `${event.target.value} hari`;
    });

    ui.get('closeAddSurahBtn').addEventListener('click', () => hideModal('addSurahModal'));
    ui.get('addSurahModal').addEventListener('click', (event) => {
      if (event.target.id === 'addSurahModal') hideModal('addSurahModal');
    });

    ui.get('closeUserDetailBtn').addEventListener('click', () => hideModal('userDetailModal'));
    ui.get('userDetailModal').addEventListener('click', (event) => {
      if (event.target.id === 'userDetailModal') hideModal('userDetailModal');
    });

    ui.get('confirmAddSurahBtn').addEventListener('click', async () => {
      const surahId = ui.get('newSurahSelect').value;
      const targetDays = Number(ui.get('targetDaysSlider').value);
      const surah = App.state.allSurahs.find((item) => item.id === surahId);

      if (!surahId) {
        ui.showToast('Silakan pilih surah terlebih dahulu.', 'error');
        return;
      }

      if (targetDays < 30 || targetDays > 365) {
        ui.showToast('Target hari harus antara 30-365.', 'error');
        return;
      }

      hideModal('addSurahModal');
      const confirmed = await showConfirmModal({
        icon: '+',
        title: 'Tambah Surah',
        message: [
          ui.create('p', {}, [
            'Tambahkan ',
            ui.create('strong', { text: surah?.name || 'surah ini' }),
            ` dengan target ${targetDays} hari?`
          ])
        ],
        type: 'success',
        confirmText: 'Ya, Tambahkan'
      });

      if (confirmed) await App.surahs.addSurah(surahId, targetDays);
    });
  }

  App.modals = {
    showModal,
    hideModal,
    showConfirmModal,
    showAddSurahModal,
    setupModalEvents
  };
})(window.App);
