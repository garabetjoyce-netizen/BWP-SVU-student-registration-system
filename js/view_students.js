/* =========================================================
   view_students.js - the students list.

   The page asks the server for ONE page of students at a time:
     view_students.php?ajax=1&page=2&search=sara&sort=name&order=asc
   The server does the searching (SQL LIKE), sorting (ORDER BY) and
   paging (LIMIT/OFFSET); this file only draws the result.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  // Current state of the list. Kept in the URL too, so refresh keeps it.
  const urlParams = new URLSearchParams(window.location.search);
  const state = {
    page: Number(urlParams.get('page')) || 1,
    search: urlParams.get('search') || '',
    sort: urlParams.get('sort') || 'id',
    order: urlParams.get('order') === 'asc' ? 'asc' : 'desc'
  };

  const body = document.getElementById('studentsBody');
  const searchInput = document.getElementById('searchInput');
  const clearSearch = document.getElementById('clearSearch');
  const sortSelect = document.getElementById('sortSelect');
  const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
  let studentToDelete = null;

  searchInput.value = state.search;
  clearSearch.classList.toggle('d-none', !state.search);

  /* ---------- Load and draw ---------- */

  async function loadStudents() {
    saveStateInUrl();
    updateSortUi();
    body.innerHTML = `<tr><td colspan="7" class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></td></tr>`;

    try {
      const result = await Api.getStudents(state);
      if (result.success === false) throw new Error(result.message || 'Could not load students.');

      // The server may correct the page number (e.g. page 9 of 3)
      state.page = result.pagination.page;
      renderRows(result.students);
      renderPagination(result.pagination);
    } catch (error) {
      body.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-5">
        <i class="bi bi-x-circle me-1"></i>${escapeHtml(error.message)}</td></tr>`;
      document.getElementById('pagination').innerHTML = '';
      document.getElementById('pageInfo').textContent = '';
    }
  }

  function renderRows(students) {
    if (students.length === 0) {
      body.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-5">
        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
        ${state.search ? 'No students match "' + escapeHtml(state.search) + '".' : 'No students yet. Click "Add Student" to create one.'}
      </td></tr>`;
      return;
    }

    // escapeHtml() on every value so a name like <script> can't run as code
    body.innerHTML = students.map(s => `
      <tr>
        <td class="d-none d-sm-table-cell text-muted">${escapeHtml(s.id)}</td>
        <td>
          <div class="d-flex align-items-center gap-2">
            ${avatarHtml(s)}
            <div class="text-break">
              <div class="fw-semibold">${escapeHtml(s.name)}</div>
              <!-- On phones the email/phone columns are hidden, so show them here -->
              <small class="text-muted d-md-none d-block">${escapeHtml(s.email)}</small>
              <small class="text-muted d-lg-none d-block">${escapeHtml(s.phone)}</small>
            </div>
          </div>
        </td>
        <td class="d-none d-md-table-cell text-break">${escapeHtml(s.email)}</td>
        <td class="d-none d-lg-table-cell text-nowrap">${escapeHtml(s.phone)}</td>
        <td class="d-none d-xl-table-cell"><small>${escapeHtml(s.address)}</small></td>
        <td class="d-none d-lg-table-cell text-nowrap"><small>${escapeHtml(formatDate(s.created_at))}</small></td>
        <td class="text-end text-nowrap">
          <a href="update_student.php?id=${encodeURIComponent(s.id)}" class="btn btn-sm btn-outline-primary" title="Edit">
            <i class="bi bi-pencil"></i><span class="d-none d-xl-inline ms-1">Edit</span>
          </a>
          <button type="button" class="btn btn-sm btn-outline-danger" title="Delete"
                  data-delete-id="${escapeHtml(s.id)}" data-delete-name="${escapeHtml(s.name)}">
            <i class="bi bi-trash"></i><span class="d-none d-xl-inline ms-1">Delete</span>
          </button>
        </td>
      </tr>`).join('');
  }

  function renderPagination({ page, per_page, total, total_pages }) {
    document.getElementById('totalCount').textContent = state.search ? total + ' matching' : total;

    const from = total === 0 ? 0 : (page - 1) * per_page + 1;
    const to = Math.min(page * per_page, total);
    document.getElementById('pageInfo').textContent = `Showing ${from}-${to} of ${total}`;

    // Previous, up to 5 numbered pages around the current one, Next
    const start = Math.max(1, Math.min(page - 2, total_pages - 4));
    const end = Math.min(total_pages, start + 4);
    let html = pageItem(page - 1, '<i class="bi bi-chevron-left"></i> Previous', page === 1);
    for (let p = start; p <= end; p++) html += pageItem(p, p, false, p === page);
    html += pageItem(page + 1, 'Next <i class="bi bi-chevron-right"></i>', page === total_pages);

    document.getElementById('pagination').innerHTML = html;
  }

  function pageItem(page, label, disabled, active = false) {
    return `<li class="page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}">
      <a class="page-link" href="#" data-page="${page}" ${active ? 'aria-current="page"' : ''}>${label}</a>
    </li>`;
  }

  // "2025-10-21 14:03:00" -> "21 Oct 2025"
  function formatDate(value) {
    if (!value) return '';
    const date = new Date(String(value).replace(' ', 'T'));
    return isNaN(date) ? value : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /* ---------- Sorting ---------- */

  // Arrow icon on the sorted column + matching option in the dropdown
  function updateSortUi() {
    document.querySelectorAll('th.sortable').forEach(th => {
      const icon = th.querySelector('i');
      const isSorted = th.dataset.sort === state.sort;
      icon.className = 'bi ' + (isSorted ? (state.order === 'asc' ? 'bi-sort-up' : 'bi-sort-down') : 'bi-arrow-down-up text-muted opacity-50');
    });
    const option = state.sort + ':' + state.order;
    if ([...sortSelect.options].some(o => o.value === option)) sortSelect.value = option;
  }

  // Clicking a column header: sort by it, click again to reverse
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      if (state.sort === th.dataset.sort) {
        state.order = state.order === 'asc' ? 'desc' : 'asc';
      } else {
        state.sort = th.dataset.sort;
        state.order = 'asc';
      }
      state.page = 1;
      loadStudents();
    });
  });

  sortSelect.addEventListener('change', () => {
    [state.sort, state.order] = sortSelect.value.split(':');
    state.page = 1;
    loadStudents();
  });

  /* ---------- Search ---------- */

  // Waits 300 ms after the last key press, then searches from page 1
  searchInput.addEventListener('input', debounce(() => {
    state.search = searchInput.value.trim();
    state.page = 1;
    clearSearch.classList.toggle('d-none', !state.search);
    loadStudents();
  }, 300));

  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    state.search = '';
    state.page = 1;
    clearSearch.classList.add('d-none');
    loadStudents();
    searchInput.focus();
  });

  /* ---------- Pagination clicks ---------- */

  document.getElementById('pagination').addEventListener('click', event => {
    const link = event.target.closest('a[data-page]');
    if (!link) return;
    event.preventDefault();
    if (link.parentElement.classList.contains('disabled')) return;

    state.page = Number(link.dataset.page);
    loadStudents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- Delete with confirmation ---------- */

  // One listener on the table body handles every delete button (event delegation)
  body.addEventListener('click', event => {
    const button = event.target.closest('[data-delete-id]');
    if (!button) return;

    studentToDelete = button.dataset.deleteId;
    document.getElementById('deleteName').textContent = button.dataset.deleteName;
    deleteModal.show();
  });

  const confirmButton = document.getElementById('confirmDelete');
  confirmButton.addEventListener('click', async () => {
    confirmButton.disabled = true;
    confirmButton.querySelector('.spinner-border').classList.remove('d-none');

    try {
      const result = await Api.deleteStudent(studentToDelete);
      if (!result.success) throw new Error(result.message || 'Delete failed.');
      showToast(MESSAGES.deleted, 'success');
      loadStudents(); // reload the current page (server fixes the page number if it became empty)
    } catch (error) {
      showToast(error.message, 'danger');
    } finally {
      deleteModal.hide();
      confirmButton.disabled = false;
      confirmButton.querySelector('.spinner-border').classList.add('d-none');
    }
  });

  /* ---------- URL ---------- */

  function saveStateInUrl() {
    const params = new URLSearchParams();
    if (state.page > 1) params.set('page', state.page);
    if (state.search) params.set('search', state.search);
    if (state.sort !== 'id' || state.order !== 'desc') {
      params.set('sort', state.sort);
      params.set('order', state.order);
    }
    const query = params.toString();
    history.replaceState(null, '', window.location.pathname + (query ? '?' + query : ''));
  }

  loadStudents();
});
