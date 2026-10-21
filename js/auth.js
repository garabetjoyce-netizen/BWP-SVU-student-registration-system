/* =========================================================
   auth.js - client-side checks for the login and register
   forms. The real checks (does the user exist? is the email
   taken?) happen in login.php / register.php on the server.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) setupLoginForm(loginForm);
  if (registerForm) setupRegisterForm(registerForm);
});

// Shows a spinner on the submit button so the user can't click twice
function setLoading(form) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.querySelector('.spinner-border').classList.remove('d-none');
}

/* ---------- Login ---------- */
function setupLoginForm(form) {
  form.addEventListener('submit', event => {
    // checkValidity() uses the "required" attributes in the HTML
    if (!form.checkValidity()) {
      event.preventDefault();
      form.classList.add('was-validated'); // Bootstrap shows the red messages
      return;
    }
    setLoading(form); // valid -> the browser sends the form to login.php
  });
}

/* ---------- Register ---------- */
function setupRegisterForm(form) {
  const password = document.getElementById('password');
  const confirm = document.getElementById('confirm_password');

  // Update strength meter and "passwords match" check while typing
  password.addEventListener('input', () => {
    updateStrength(password.value);
    checkPasswordRules(password);
    checkPasswordsMatch(password, confirm);
  });
  confirm.addEventListener('input', () => checkPasswordsMatch(password, confirm));

  form.addEventListener('submit', event => {
    checkPasswordRules(password);
    checkPasswordsMatch(password, confirm);

    if (!form.checkValidity()) {
      event.preventDefault();
      form.classList.add('was-validated');
      return;
    }
    setLoading(form);
  });
}

// Password must contain at least one letter and one number (length is checked by minlength)
function checkPasswordRules(input) {
  const ok = /[A-Za-z]/.test(input.value) && /[0-9]/.test(input.value);
  input.setCustomValidity(ok ? '' : 'Password needs a letter and a number.');
}

// setCustomValidity('') = valid, any other text = invalid
function checkPasswordsMatch(password, confirm) {
  const match = confirm.value !== '' && confirm.value === password.value;
  confirm.setCustomValidity(match ? '' : 'Passwords do not match.');
}

// Gives 0-4 points and colors the bar under the password field
function updateStrength(value) {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;

  const levels = [
    { text: '', color: 'transparent' },
    { text: 'Weak', color: '#dc3545' },
    { text: 'Fair', color: '#fd7e14' },
    { text: 'Good', color: '#0d6efd' },
    { text: 'Strong', color: '#198754' }
  ];
  const level = value ? levels[Math.max(score, 1)] : levels[0];

  const bar = document.getElementById('strengthBar');
  bar.style.width = value ? (Math.max(score, 1) * 25) + '%' : '0%';
  bar.style.backgroundColor = level.color;
  document.getElementById('strengthText').textContent = level.text ? 'Strength: ' + level.text : '';
}
