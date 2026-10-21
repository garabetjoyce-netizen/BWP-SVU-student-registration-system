/* =========================================================
   student-form.js - used by BOTH add_student.php and
   update_student.php (the form has data-mode="add" or "update").

   - AJAX validation: each field is sent to validate_student.php
     when the user leaves it, and the server's error messages are
     shown under the fields without reloading the page.
   - Picture preview + size/type check before upload.
   - Update mode: loads the student's current data into the form.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('studentForm');
  if (!form) return;

  const mode = form.dataset.mode; // "add" or "update"
  const fields = ['name', 'email', 'phone', 'address'];
  const touched = new Set();       // fields the user already visited
  let requestNumber = 0;           // ignore old AJAX answers that arrive late

  /* ---------- Show / clear errors under a field ---------- */

  function setFieldError(field, message) {
    const input = document.getElementById(field);
    const feedback = form.querySelector(`[data-error-for="${field}"]`);
    if (message) {
      input.classList.add('is-invalid');
      input.classList.remove('is-valid');
      feedback.textContent = message;
    } else {
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      feedback.textContent = '';
    }
  }

  // Form data WITHOUT the picture (no need to upload the image on every check)
  function formDataForValidation() {
    const data = new FormData(form);
    data.delete('profile_picture');
    return data;
  }

  /* ---------- AJAX validation ---------- */

  // Asks the server to validate the form. Only shows errors for
  // the fields in "showFor" (so untouched fields don't turn red early).
  async function validate(showFor) {
    const thisRequest = ++requestNumber;
    try {
      const result = await Api.validateStudent(formDataForValidation());
      if (thisRequest !== requestNumber) return null; // a newer check is running

      const errors = result.errors || {};
      showFor.forEach(field => setFieldError(field, errors[field]));
      return result;
    } catch (error) {
      showAlert('formAlert', 'Could not reach the server to validate the form: ' + error.message);
      return null;
    }
  }

  const validateLater = debounce(() => validate([...touched]), 400);

  fields.forEach(field => {
    const input = document.getElementById(field);

    // When the user leaves a field -> check it
    input.addEventListener('blur', () => {
      touched.add(field);
      validate([...touched]);
    });

    // While typing in a field that was already checked -> re-check after a pause
    input.addEventListener('input', () => {
      if (touched.has(field)) validateLater();
    });
  });

  /* ---------- Profile picture ---------- */

  const pictureInput = document.getElementById('profile_picture');
  const preview = document.getElementById('picturePreview');
  const placeholder = document.getElementById('picturePlaceholder');
  let originalPicture = ''; // the current picture in update mode

  function showPicture(src) {
    preview.src = src || '';
    preview.classList.toggle('d-none', !src);
    placeholder.classList.toggle('d-none', !!src);
  }

  // Returns an error message, or '' if the file is OK (or no file chosen)
  function checkPicture() {
    const file = pictureInput.files[0];
    if (!file) return '';
    if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Only JPG, PNG, GIF or WEBP images are allowed.';
    if (file.size > CONFIG.MAX_IMAGE_SIZE) return 'The image must be 2 MB or smaller.';
    return '';
  }

  pictureInput.addEventListener('change', () => {
    const error = checkPicture();
    const feedback = form.querySelector('[data-error-for="profile_picture"]');
    pictureInput.classList.toggle('is-invalid', !!error);
    feedback.textContent = error;

    if (error || !pictureInput.files[0]) {
      if (error) pictureInput.value = ''; // don't keep a bad file
      showPicture(originalPicture);
      return;
    }
    // Show the chosen image before uploading it
    showPicture(URL.createObjectURL(pictureInput.files[0]));
  });

  // "Clear" button: also reset the preview and the red/green borders
  form.addEventListener('reset', () => {
    touched.clear();
    form.querySelectorAll('.is-invalid, .is-valid').forEach(el => el.classList.remove('is-invalid', 'is-valid'));
    showPicture(originalPicture);
  });

  /* ---------- Submit ---------- */

  const submitButton = form.querySelector('button[type="submit"]');

  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.querySelector('.spinner-border').classList.toggle('d-none', !isLoading);
  }

  form.addEventListener('submit', async event => {
    event.preventDefault(); // stop the normal submit until the server says the data is valid

    if (checkPicture()) return;

    setLoading(true);
    fields.forEach(field => touched.add(field));
    const result = await validate(fields);

    if (!result || !result.valid) {
      setLoading(false);
      const firstError = form.querySelector('.is-invalid');
      if (firstError) firstError.focus();
      return;
    }

    if (CONFIG.USE_MOCK) {
      await saveInMockMode();
      return;
    }

    // Valid -> send the form (with the picture) to add_student.php / update_student.php.
    // form.submit() does NOT fire this "submit" event again, so there is no loop.
    form.submit();
  });

  // Mock mode only: save to localStorage and go to the list, like the backend would
  async function saveInMockMode() {
    const file = pictureInput.files[0];
    const pictureDataUrl = file ? await readAsDataUrl(file) : null;
    await MockApi.saveStudent(new FormData(form), pictureDataUrl);
    window.location.href = 'view_students.php?success=' + (mode === 'add' ? 'added' : 'updated');
  }

  function readAsDataUrl(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  /* ---------- Update mode: load the current data ---------- */

  if (mode === 'update') loadStudent();

  async function loadStudent() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
      window.location.href = 'view_students.php?error=not_found';
      return;
    }

    try {
      const result = await Api.getStudent(id);
      if (!result.success) {
        window.location.href = 'view_students.php?error=not_found';
        return;
      }

      const student = result.student;
      document.getElementById('id').value = student.id;
      fields.forEach(field => { document.getElementById(field).value = student[field] ?? ''; });
      document.getElementById('createdAt').textContent = student.created_at || '-';

      // Make "Clear" go back to these values instead of empty fields
      fields.forEach(field => { document.getElementById(field).defaultValue = student[field] ?? ''; });
      originalPicture = student.profile_picture || '';
      showPicture(originalPicture);

      document.getElementById('loadingBox').classList.add('d-none');
      form.classList.remove('d-none');
    } catch (error) {
      document.getElementById('loadingBox').innerHTML =
        `<p class="text-danger mb-0"><i class="bi bi-x-circle me-1"></i>Could not load the student: ${escapeHtml(error.message)}</p>`;
    }
  }
});
