/* =========================================================
   main.js - small helpers shared by every page.
   ========================================================= */

// Messages the backend can trigger by redirecting with
// ?success=<code> or ?error=<code> in the URL.
const MESSAGES = {
  // success codes
  registered: 'Account created! You can now log in.',
  logged_out: 'You have been logged out.',
  added: 'Student added successfully.',
  updated: 'Student updated successfully.',
  deleted: 'Student deleted successfully.',

  // error codes
  invalid_credentials: 'Wrong username/email or password.',
  login_required: 'Please log in to access that page.',
  username_taken: 'That username is already taken.',
  email_taken: 'That email is already registered.',
  password_mismatch: 'Passwords do not match.',
  missing_fields: 'Please fill in all required fields.',
  invalid_email: 'Please enter a valid email address.',
  upload_failed: 'The profile picture could not be uploaded.',
  invalid_file: 'Only JPG, PNG, GIF or WEBP images up to 2 MB are allowed.',
  not_found: 'Student not found.',
  server_error: 'Something went wrong on the server. Please try again.'
};

// Converts text to safe HTML (prevents XSS when showing user data)
function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

// First letters of the first two words: "Sara Khoury" -> "SK"
function initials(name) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

// HTML for a student's picture, or a circle with initials if there is none
function avatarHtml(student) {
  if (student.profile_picture) {
    return `<img src="${escapeHtml(student.profile_picture)}" alt="${escapeHtml(student.name)}" class="avatar">`;
  }
  return `<span class="avatar avatar-initials">${escapeHtml(initials(student.name))}</span>`;
}

// Bootstrap toast in the top-right corner. type: 'success' | 'danger' | 'warning' | 'info'
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(container);
  }

  const icons = { success: 'check-circle-fill', danger: 'x-circle-fill', warning: 'exclamation-triangle-fill', info: 'info-circle-fill' };
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-bg-${type} border-0`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body"><i class="bi bi-${icons[type] || icons.info} me-2"></i>${escapeHtml(message)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>`;
  container.appendChild(toast);

  new bootstrap.Toast(toast, { delay: 4000 }).show();
  toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

// Bootstrap alert inside a page element (used on login/register forms)
function showAlert(elementId, message, type = 'danger') {
  const box = document.getElementById(elementId);
  if (!box) return;
  box.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
}

// Reads ?success= / ?error= from the URL and shows the matching message
function showMessagesFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const success = params.get('success');
  const error = params.get('error');
  const alertBox = document.getElementById('formAlert');

  if (success) {
    const text = MESSAGES[success] || success;
    alertBox ? showAlert('formAlert', text, 'success') : showToast(text, 'success');
  }
  if (error) {
    const text = MESSAGES[error] || error;
    alertBox ? showAlert('formAlert', text, 'danger') : showToast(text, 'danger');
  }

  // Remove the codes from the address bar so a refresh doesn't show them again
  if (success || error) {
    params.delete('success');
    params.delete('error');
    const query = params.toString();
    history.replaceState(null, '', window.location.pathname + (query ? '?' + query : ''));
  }
}

// Eye button next to password fields: <button data-toggle-password="fieldId">
function setupPasswordToggles() {
  document.querySelectorAll('[data-toggle-password]').forEach(button => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.togglePassword);
      const hidden = input.type === 'password';
      input.type = hidden ? 'text' : 'password';
      button.querySelector('i').className = hidden ? 'bi bi-eye-slash' : 'bi bi-eye';
    });
  });
}

// Waits until the user stops typing before running fn (used for search)
function debounce(fn, wait = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  showMessagesFromUrl();
  setupPasswordToggles();

  // Current year in the footer
  document.querySelectorAll('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });

  // Reminder banner while testing with fake data
  if (typeof CONFIG !== 'undefined' && CONFIG.USE_MOCK && document.querySelector('[data-needs-backend]')) {
    const banner = document.createElement('div');
    banner.className = 'alert alert-warning text-center rounded-0 mb-0 py-2 small';
    banner.innerHTML = '<i class="bi bi-cone-striped me-1"></i> Demo mode: using fake data stored in your browser (set <code>USE_MOCK: false</code> in js/config.js to use the real backend).';
    document.body.prepend(banner);
  }
});
