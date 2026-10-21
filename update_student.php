<?php
/* =====================================================================
   BACKEND SECTION - written by the backend teammate.
   Put here (see README_INTEGRATION.md, section 5):
     1. Session check (redirect to login.html if not logged in)
     2. If the request is POST: update the student with id = $_POST['id']
        (and replace the picture if a new one was uploaded),
        then redirect to view_students.php?success=updated
   The form is pre-filled by JavaScript using get_student.php?id=...
   ===================================================================== */
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Update Student | Student Registration System</title>

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
          <li class="nav-item"><a class="nav-link active" href="view_students.php">Students</a></li>
          <li class="nav-item"><a class="nav-link" href="add_student.php">Add Student</a></li>
          <li class="nav-item"><a class="nav-link" href="logout.php"><i class="bi bi-box-arrow-right me-1"></i>Logout</a></li>
        </ul>
      </div>
    </div>
  </nav>

  <main class="py-4 py-md-5">
    <div class="container" style="max-width: 900px;">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a href="view_students.php">Students</a></li>
          <li class="breadcrumb-item active" aria-current="page">Update Student</li>
        </ol>
      </nav>

      <div class="card card-soft p-3 p-md-4">
        <h3 class="fw-bold mb-1"><i class="bi bi-pencil-square text-primary me-2"></i>Update Student</h3>
        <p class="text-muted small mb-4">Change any field and click <strong>Save Changes</strong>. Leave the picture empty to keep the current one.</p>

        <div id="formAlert"></div>

        <!-- Shown while the student's current data is loading -->
        <div id="loadingBox" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="text-muted mt-2 mb-0">Loading student...</p>
        </div>

        <form id="studentForm" data-mode="update" action="update_student.php" method="POST" enctype="multipart/form-data" novalidate class="d-none">
          <!-- Which student is being edited (filled by JavaScript) -->
          <input type="hidden" id="id" name="id">

          <div class="row g-4">
            <div class="col-12 col-md-4 text-center">
              <img id="picturePreview" src="" alt="Profile preview" class="avatar-preview mb-3 d-none">
              <div id="picturePlaceholder" class="avatar-preview avatar-initials mx-auto mb-3 fs-1">
                <i class="bi bi-person"></i>
              </div>
              <label for="profile_picture" class="form-label d-block">Change Picture <span class="text-muted small">(optional)</span></label>
              <input type="file" class="form-control form-control-sm" id="profile_picture" name="profile_picture"
                     accept="image/jpeg,image/png,image/gif,image/webp">
              <div class="invalid-feedback" data-error-for="profile_picture"></div>
              <div class="form-text">JPG, PNG, GIF or WEBP &middot; max 2 MB</div>
            </div>

            <div class="col-12 col-md-8">
              <div class="row g-3">
                <div class="col-12">
                  <label for="name" class="form-label">Full Name <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="name" name="name" maxlength="100">
                  <div class="invalid-feedback" data-error-for="name"></div>
                </div>

                <div class="col-12 col-sm-6">
                  <label for="email" class="form-label">Email <span class="text-danger">*</span></label>
                  <input type="email" class="form-control" id="email" name="email" maxlength="100">
                  <div class="invalid-feedback" data-error-for="email"></div>
                </div>

                <div class="col-12 col-sm-6">
                  <label for="phone" class="form-label">Phone Number <span class="text-danger">*</span></label>
                  <input type="tel" class="form-control" id="phone" name="phone" maxlength="15">
                  <div class="invalid-feedback" data-error-for="phone"></div>
                </div>

                <div class="col-12">
                  <label for="address" class="form-label">Address <span class="text-danger">*</span></label>
                  <textarea class="form-control" id="address" name="address" rows="3"></textarea>
                  <div class="invalid-feedback" data-error-for="address"></div>
                </div>

                <div class="col-12">
                  <small class="text-muted"><i class="bi bi-clock me-1"></i>Registered on <span id="createdAt">-</span></small>
                </div>
              </div>
            </div>
          </div>

          <hr class="my-4">

          <div class="d-flex flex-column flex-sm-row justify-content-end gap-2">
            <a href="view_students.php" class="btn btn-outline-secondary">Cancel</a>
            <button type="submit" class="btn btn-brand px-4">
              <span class="spinner-border spinner-border-sm me-1 d-none" aria-hidden="true"></span>
              <i class="bi bi-check-lg me-1"></i>Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </main>

  <footer class="bg-dark text-white-50 text-center py-3">
    <div class="container">&copy; <span class="js-year"></span> StudentHub &middot; BWP501 Project</div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="js/config.js"></script>
  <script src="js/main.js"></script>
  <script src="js/api.js"></script>
  <script src="js/student-form.js"></script>
</body>
</html>
