/* =========================================================
   config.js - ONE place for every backend URL.
   If the backend team names a file differently, change it
   here and every page keeps working.
   ========================================================= */

const CONFIG = {
  // true  = use fake data saved in the browser (for testing the frontend alone)
  // false = talk to the real PHP backend
  USE_MOCK: true,

  STUDENTS_PER_PAGE: 10,

  // Maximum profile picture size the frontend accepts (2 MB)
  MAX_IMAGE_SIZE: 2 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

  API: {
    // GET  -> JSON list of students (search, sort, pagination)
    students: 'view_students.php?ajax=1',
    // GET  -> JSON of one student (used to pre-fill the update form)
    student: 'get_student.php',
    // POST -> JSON validation result for the add/update form
    validate: 'validate_student.php',
    // POST -> JSON result of deleting a student
    delete: 'delete_student.php'
  },

  // Where the HTML forms send their data (normal form submission)
  PAGES: {
    login: 'login.php',
    register: 'register.php',
    logout: 'logout.php',
    addStudent: 'add_student.php',
    updateStudent: 'update_student.php'
  }
};
