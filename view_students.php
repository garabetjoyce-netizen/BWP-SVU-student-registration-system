<?php
/* =====================================================================
   BACKEND SECTION - written by the backend teammate.
   Put here (see README_INTEGRATION.md, section 3):
     1. Session check (redirect to login.html if not logged in;
        for AJAX requests answer with HTTP 401 instead)
     2. If $_GET['ajax'] is set: read page/search/sort/order,
        query the database, echo the JSON and exit;
   Otherwise the HTML page below is sent, and js/view_students.js
   loads the table through AJAX.
   ===================================================================== */
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Students | Student Registration System</title>

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
  <link href="css/style.css" rel="stylesheet">
</head>
<body data-needs-backend>

  <nav class="navbar navbar-expand-lg navbar-dark bg-brand">
    <div class="container">
      <a class="navbar-brand" href="index.html"><i class="bi bi-mortarboard-fill me-2"></i>StudentHub</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav"
              aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="mainNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item"><a class="nav-link" href="index.html">Home</a></li>
          <li class="nav-item"><a class="nav-link active" aria-current="page" href="view_students.php">Students</a></li>
          <li class="nav-item"><a class="nav-link" href="add_student.php">Add Student</a></li>
          <li class="nav-item"><a class="nav-link" href="logout.php"><i class="bi bi-box-arrow-right me-1"></i>Logout</a></li>
        </ul>
      </div>
    </div>
  </nav>

  <main class="py-4 py-md-5">
    <div class="container">

      <!-- Title + add button -->
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h3 class="fw-bold mb-0">Students</h3>
          <small class="text-muted"><span id="totalCount">0</span> registered students</small>
        </div>
        <a href="add_student.php" class="btn btn-brand"><i class="bi bi-person-plus-fill me-1"></i> Add Student</a>
      </div>

      <div class="card card-soft">
        <div class="card-body p-3 p-md-4">

          <!-- Search bar -->
          <div class="row g-2 mb-3">
            <div class="col-12 col-md-8 col-lg-6">
              <div class="input-group">
                <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
                <input type="search" id="searchInput" class="form-control" placeholder="Search by name, email or phone..."
                       aria-label="Search students">
                <button class="btn btn-outline-secondary d-none" type="button" id="clearSearch" aria-label="Clear search">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
            <!-- Sort dropdown: handy on phones where some columns are hidden -->
            <div class="col-12 col-md-4 col-lg-3 ms-lg-auto">
              <select id="sortSelect" class="form-select" aria-label="Sort students">
                <option value="id:desc">Newest first</option>
                <option value="id:asc">Oldest first</option>
                <option value="name:asc">Name (A-Z)</option>
                <option value="name:desc">Name (Z-A)</option>
                <option value="email:asc">Email (A-Z)</option>
                <option value="email:desc">Email (Z-A)</option>
              </select>
            </div>
          </div>

          <!-- Students table (rows are added by js/view_students.js) -->
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="sortable d-none d-sm-table-cell" data-sort="id"># <i class="bi"></i></th>
                  <th class="sortable" data-sort="name">Student <i class="bi"></i></th>
                  <th class="sortable d-none d-md-table-cell" data-sort="email">Email <i class="bi"></i></th>
                  <th class="d-none d-lg-table-cell">Phone</th>
                  <th class="d-none d-xl-table-cell">Address</th>
                  <th class="sortable d-none d-lg-table-cell" data-sort="created_at">Registered <i class="bi"></i></th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody id="studentsBody">
                <tr><td colspan="7" class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></td></tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 mt-3">
            <small class="text-muted" id="pageInfo"></small>
            <nav aria-label="Students pages">
              <ul class="pagination pagination-sm mb-0 flex-wrap justify-content-center" id="pagination"></ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- ===== Delete confirmation modal ===== -->
  <div class="modal fade" id="deleteModal" tabindex="-1" aria-labelledby="deleteModalTitle" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="deleteModalTitle"><i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>Delete student?</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          Are you sure you want to delete <strong id="deleteName"></strong>?
          <br><span class="text-muted small">This cannot be undone.</span>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-danger" id="confirmDelete">
            <span class="spinner-border spinner-border-sm me-1 d-none" aria-hidden="true"></span>
            <i class="bi bi-trash me-1"></i>Delete
          </button>
        </div>
      </div>
    </div>
  </div>

  <footer class="bg-dark text-white-50 text-center py-3">
    <div class="container">&copy; <span class="js-year"></span> StudentHub &middot; BWP501 Project</div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="js/config.js"></script>
  <script src="js/main.js"></script>
  <script src="js/api.js"></script>
  <script src="js/view_students.js"></script>
</body>
</html>
