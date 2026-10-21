/* =========================================================
   api.js - every AJAX call to the backend goes through here.

   Each function returns a Promise with the JSON the backend
   sends back. When CONFIG.USE_MOCK is true, the same functions
   answer with fake data stored in localStorage instead, so the
   frontend can be tested before the backend is ready.
   ========================================================= */

const Api = {
  /* ---------- Real backend calls ---------- */

  async getStudents({ page = 1, search = '', sort = 'id', order = 'desc' } = {}) {
    if (CONFIG.USE_MOCK) return MockApi.getStudents({ page, search, sort, order });

    const params = new URLSearchParams({ page, search, sort, order, per_page: CONFIG.STUDENTS_PER_PAGE });
    return request(addParams(CONFIG.API.students, params));
  },

  async getStudent(id) {
    if (CONFIG.USE_MOCK) return MockApi.getStudent(id);

    return request(addParams(CONFIG.API.student, new URLSearchParams({ id })));
  },

  async deleteStudent(id) {
    if (CONFIG.USE_MOCK) return MockApi.deleteStudent(id);

    const body = new FormData();
    body.append('id', id);
    return request(CONFIG.API.delete, { method: 'POST', body });
  },

  async validateStudent(formData) {
    if (CONFIG.USE_MOCK) return MockApi.validateStudent(formData);

    return request(CONFIG.API.validate, { method: 'POST', body: formData });
  }
};

// Adds query parameters to a URL that may already contain some (e.g. "?ajax=1")
function addParams(url, params) {
  return url + (url.includes('?') ? '&' : '?') + params.toString();
}

// Shared fetch helper: sends the request, handles "not logged in", parses JSON
async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin', // send the PHP session cookie
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    ...options
  });

  // 401 = the PHP session expired or the user is not logged in
  if (response.status === 401) {
    window.location.href = 'login.html?error=login_required';
    throw new Error('Not logged in');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The server did not return valid JSON (' + response.status + ').');
  }

  if (!response.ok && data.success !== false) {
    throw new Error(data.message || 'Server error (' + response.status + ').');
  }
  return data;
}

/* =========================================================
   MockApi - fake backend for testing. Not used when
   CONFIG.USE_MOCK is false, so it can be deleted later.
   ========================================================= */

const MockApi = {
  STORAGE_KEY: 'mock_students',

  load() {
    let students = null;
    try {
      students = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
    } catch { /* storage unavailable - fall through to seed data */ }

    if (!Array.isArray(students)) {
      students = this.seed();
      this.save(students);
    }
    return students;
  },

  save(students) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(students));
    } catch {
      console.warn('Mock data could not be saved (storage full or blocked).');
    }
  },

  seed() {
    const first = ['Ahmad', 'Sara', 'Omar', 'Lina', 'Khaled', 'Rana', 'Yousef', 'Maya', 'Hadi', 'Nour', 'Sami', 'Dana'];
    const last = ['Haddad', 'Khoury', 'Nasser', 'Saleh', 'Hamdan', 'Darwish'];
    const cities = ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Tartus'];
    const students = [];

    for (let i = 1; i <= 27; i++) {
      const name = first[i % first.length] + ' ' + last[i % last.length];
      students.push({
        id: i,
        name,
        email: name.toLowerCase().replace(' ', '.') + i + '@example.com',
        phone: '09' + String(30000000 + i * 1234567).slice(0, 8),
        address: (i * 7) + ' Main Street, ' + cities[i % cities.length],
        profile_picture: null,
        created_at: new Date(Date.now() - i * 86400000).toISOString().slice(0, 19).replace('T', ' ')
      });
    }
    return students;
  },

  delay(data) {
    // Pretend the network takes a moment, so loading spinners are visible
    return new Promise(resolve => setTimeout(() => resolve(data), 250));
  },

  getStudents({ page, search, sort, order }) {
    let list = this.load();

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q));
    }

    list.sort((a, b) => {
      const x = String(a[sort] ?? '').toLowerCase();
      const y = String(b[sort] ?? '').toLowerCase();
      const result = sort === 'id' ? a.id - b.id : x.localeCompare(y);
      return order === 'asc' ? result : -result;
    });

    const perPage = CONFIG.STUDENTS_PER_PAGE;
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const current = Math.min(Math.max(1, page), totalPages);

    return this.delay({
      success: true,
      students: list.slice((current - 1) * perPage, current * perPage),
      pagination: { page: current, per_page: perPage, total, total_pages: totalPages }
    });
  },

  getStudent(id) {
    const student = this.load().find(s => s.id === Number(id));
    return this.delay(student
      ? { success: true, student }
      : { success: false, message: 'Student not found.' });
  },

  deleteStudent(id) {
    const students = this.load();
    const remaining = students.filter(s => s.id !== Number(id));
    this.save(remaining);
    return this.delay({ success: remaining.length < students.length, message: 'Student deleted.' });
  },

  // Same rules the real validate_student.php should apply
  validateStudent(formData) {
    const errors = {};
    const name = (formData.get('name') || '').trim();
    const email = (formData.get('email') || '').trim();
    const phone = (formData.get('phone') || '').trim();
    const address = (formData.get('address') || '').trim();
    const id = Number(formData.get('id')) || 0;

    if (!name) errors.name = 'Name is required.';
    else if (name.length > 100) errors.name = 'Name must be 100 characters or less.';

    if (!email) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address.';
    else if (this.load().some(s => s.email.toLowerCase() === email.toLowerCase() && s.id !== id)) {
      errors.email = 'Another student already uses this email.';
    }

    if (!phone) errors.phone = 'Phone number is required.';
    else if (!/^\+?[0-9\s-]{7,15}$/.test(phone)) errors.phone = 'Phone must be 7-15 digits (may start with +).';

    if (!address) errors.address = 'Address is required.';

    return this.delay({ valid: Object.keys(errors).length === 0, errors });
  },

  // Only used in mock mode: stores the add/update form in localStorage
  async saveStudent(formData, pictureDataUrl) {
    const students = this.load();
    const id = Number(formData.get('id')) || 0;
    const data = {
      name: formData.get('name').trim(),
      email: formData.get('email').trim(),
      phone: formData.get('phone').trim(),
      address: formData.get('address').trim()
    };

    if (id) {
      const student = students.find(s => s.id === id);
      Object.assign(student, data);
      if (pictureDataUrl) student.profile_picture = pictureDataUrl;
    } else {
      students.push({
        id: students.reduce((max, s) => Math.max(max, s.id), 0) + 1,
        ...data,
        profile_picture: pictureDataUrl || null,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
    }
    this.save(students);
  }
};
