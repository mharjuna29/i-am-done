window.App = window.App || {};

(function initUi(App) {
  function get(id) {
    return document.getElementById(id);
  }

  function setHidden(elementOrId, hidden) {
    const element = typeof elementOrId === 'string' ? get(elementOrId) : elementOrId;
    if (element) element.hidden = hidden;
  }

  function clear(element) {
    if (!element) return;
    element.replaceChildren();
  }

  function create(tag, options = {}, children = []) {
    const element = document.createElement(tag);

    if (options.className) element.className = options.className;
    if (options.text !== undefined) element.textContent = options.text;
    if (options.type) element.type = options.type;
    if (options.value !== undefined) element.value = options.value;
    if (options.title) element.title = options.title;
    if (options.dataset) {
      for (const [key, value] of Object.entries(options.dataset)) {
        element.dataset[key] = value;
      }
    }
    if (options.attrs) {
      for (const [key, value] of Object.entries(options.attrs)) {
        element.setAttribute(key, value);
      }
    }

    for (const child of [].concat(children)) {
      if (child === null || child === undefined) continue;
      element.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }

    return element;
  }

  function button(text, className, dataset = {}) {
    return create('button', { className, text, type: 'button', dataset });
  }

  function emptyState(message) {
    return create('div', { className: 'empty-state' }, [
      create('p', { text: message })
    ]);
  }

  function progressBar(percent) {
    const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
    const fill = create('div', { className: 'progress-fill' });
    fill.style.width = `${safePercent}%`;
    return create('div', { className: 'progress-bar' }, [fill]);
  }

  function paginationControls({ page, totalItems, pageSize, action }) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    if (totalPages <= 1) {
      return null;
    }

    const previous = button('Previous', 'btn btn-outline', {
      action,
      direction: 'previous'
    });
    previous.disabled = page <= 1;

    const next = button('Next', 'btn btn-outline', {
      action,
      direction: 'next'
    });
    next.disabled = page >= totalPages;

    return create('div', { className: 'pagination' }, [
      previous,
      create('span', { className: 'pagination-info', text: `Page ${page} of ${totalPages}` }),
      next
    ]);
  }

  function showLoading(show) {
    setHidden('loadingOverlay', !show);
  }

  function showToast(message, type = 'info') {
    const container = get('toastContainer');
    if (!container) return;

    const toast = create('div', { className: `toast toast-${type}`, text: message });
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return `${days[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }

  function formatDateTime(value, timeZone = 'Asia/Jakarta') {
    if (!value) return '-';

    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone
    }).format(new Date(value));
  }

  function setPageVisible(page) {
    for (const name of ['dashboard', 'surahs', 'community', 'stats']) {
      setHidden(`${name}Page`, name !== page);
    }

    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.page === page);
    });
  }

  App.ui = {
    get,
    setHidden,
    clear,
    create,
    button,
    emptyState,
    progressBar,
    paginationControls,
    showLoading,
    showToast,
    formatDate,
    formatDateTime,
    setPageVisible
  };
})(window.App);
