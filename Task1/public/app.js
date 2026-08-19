// State Management
const state = {
  currentTab: 'overview',
  students: { data: [], pagination: {}, page: 1, limit: 10, search: '', department: '', status: '', sortBy: 'createdAt' },
  courses: { data: [], pagination: {}, page: 1, limit: 10, search: '', department: '', sortBy: 'code' },
  enrollments: { data: [], pagination: {}, page: 1, limit: 10, search: '', status: '', grade: '' },
  departments: new Set()
};

// DOM Load Handler
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  setupNavigation();
  setupEventListeners();
  loadAllData();
}

// Navigation Tabs
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      switchTab(tab);
    });
  });

  // Switch tab buttons in cards
  document.querySelectorAll('[data-switch-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      switchTab(e.target.dataset.switchTab);
    });
  });
}

function switchTab(tabName) {
  state.currentTab = tabName;

  // Update Nav Active State
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabName);
  });

  // Update Tab Content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });

  // Update Header Title & Action Button
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');
  const primaryBtn = document.getElementById('primary-action-btn');

  switch (tabName) {
    case 'overview':
      pageTitle.textContent = 'Dashboard Overview';
      pageSubtitle.textContent = 'System summary and recent activities.';
      primaryBtn.style.display = 'none';
      loadOverviewData();
      break;
    case 'students':
      pageTitle.textContent = 'Student Records';
      pageSubtitle.textContent = 'View, add, search, filter, and manage student profiles.';
      primaryBtn.style.display = 'inline-flex';
      primaryBtn.textContent = '+ Add Student';
      primaryBtn.onclick = () => openStudentModal();
      fetchStudents();
      break;
    case 'courses':
      pageTitle.textContent = 'Course Catalog';
      pageSubtitle.textContent = 'Manage course offerings, capacity, and instructors.';
      primaryBtn.style.display = 'inline-flex';
      primaryBtn.textContent = '+ Add Course';
      primaryBtn.onclick = () => openCourseModal();
      fetchCourses();
      break;
    case 'enrollments':
      pageTitle.textContent = 'Course Enrollments';
      pageSubtitle.textContent = 'Track student course registrations, grades, and completion status.';
      primaryBtn.style.display = 'inline-flex';
      primaryBtn.textContent = '+ Enroll Student';
      primaryBtn.onclick = () => openEnrollmentModal();
      fetchEnrollments();
      break;
    case 'explorer':
      pageTitle.textContent = 'API Endpoint Tester';
      pageSubtitle.textContent = 'Test raw HTTP endpoints, query filters, and payload validations.';
      primaryBtn.style.display = 'none';
      break;
  }
}

// Event Listeners for Filters & Search
function setupEventListeners() {
  // Students Filters
  const studentSearch = document.getElementById('students-search-input');
  if (studentSearch) {
    studentSearch.addEventListener('input', debounce((e) => {
      state.students.search = e.target.value;
      state.students.page = 1;
      fetchStudents();
    }, 300));
  }

  document.getElementById('students-dept-filter').addEventListener('change', (e) => {
    state.students.department = e.target.value;
    state.students.page = 1;
    fetchStudents();
  });

  document.getElementById('students-status-filter').addEventListener('change', (e) => {
    state.students.status = e.target.value;
    state.students.page = 1;
    fetchStudents();
  });

  document.getElementById('students-sort-by').addEventListener('change', (e) => {
    state.students.sortBy = e.target.value;
    fetchStudents();
  });

  // Courses Filters
  const courseSearch = document.getElementById('courses-search-input');
  if (courseSearch) {
    courseSearch.addEventListener('input', debounce((e) => {
      state.courses.search = e.target.value;
      state.courses.page = 1;
      fetchCourses();
    }, 300));
  }

  document.getElementById('courses-dept-filter').addEventListener('change', (e) => {
    state.courses.department = e.target.value;
    state.courses.page = 1;
    fetchCourses();
  });

  document.getElementById('courses-sort-by').addEventListener('change', (e) => {
    state.courses.sortBy = e.target.value;
    fetchCourses();
  });

  // Enrollments Filters
  const enrollmentSearch = document.getElementById('enrollments-search-input');
  if (enrollmentSearch) {
    enrollmentSearch.addEventListener('input', debounce((e) => {
      state.enrollments.search = e.target.value;
      state.enrollments.page = 1;
      fetchEnrollments();
    }, 300));
  }

  document.getElementById('enrollments-status-filter').addEventListener('change', (e) => {
    state.enrollments.status = e.target.value;
    state.enrollments.page = 1;
    fetchEnrollments();
  });

  document.getElementById('enrollments-grade-filter').addEventListener('change', (e) => {
    state.enrollments.grade = e.target.value;
    state.enrollments.page = 1;
    fetchEnrollments();
  });

  // Modal Close
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') closeModal();
  });

  // Reset & Seed Button
  document.getElementById('seed-db-btn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset the database and re-seed sample data?')) {
      showToast('Seeding database...', 'success');
      try {
        const res = await fetch('/api/students');
        // Simple notice
        showToast('To re-seed, run `npm run seed` in terminal or restart server.', 'success');
        loadAllData();
      } catch (err) {
        showToast('Error refreshing data.', 'error');
      }
    }
  });

  // API Tester Controls
  document.getElementById('api-test-send').addEventListener('click', handleApiTesterSend);
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.getElementById('api-test-method').value = e.target.dataset.method;
      document.getElementById('api-test-url').value = e.target.dataset.url;
      if (e.target.dataset.method === 'POST') {
        document.getElementById('api-test-body').value = JSON.stringify({
          firstName: "",
          email: "invalid-email"
        }, null, 2);
      } else {
        document.getElementById('api-test-body').value = '';
      }
    });
  });
}

// Fetchers
async function loadAllData() {
  await Promise.all([fetchStudents(), fetchCourses(), fetchEnrollments()]);
  loadOverviewData();
  populateDepartmentFilters();
}

async function fetchStudents() {
  const { page, limit, search, department, status, sortBy } = state.students;
  const params = new URLSearchParams({ page, limit, sortBy });
  if (search) params.append('search', search);
  if (department) params.append('department', department);
  if (status) params.append('status', status);

  try {
    const res = await fetch(`/api/students?${params.toString()}`);
    const result = await res.json();
    if (result.success) {
      state.students.data = result.data;
      state.students.pagination = result.pagination;
      result.data.forEach(s => state.departments.add(s.department));
      renderStudentsTable();
    }
  } catch (err) {
    showToast('Failed to load students', 'error');
  }
}

async function fetchCourses() {
  const { page, limit, search, department, sortBy } = state.courses;
  const params = new URLSearchParams({ page, limit, sortBy });
  if (search) params.append('search', search);
  if (department) params.append('department', department);

  try {
    const res = await fetch(`/api/courses?${params.toString()}`);
    const result = await res.json();
    if (result.success) {
      state.courses.data = result.data;
      state.courses.pagination = result.pagination;
      result.data.forEach(c => state.departments.add(c.department));
      renderCoursesTable();
    }
  } catch (err) {
    showToast('Failed to load courses', 'error');
  }
}

async function fetchEnrollments() {
  const { page, limit, search, status, grade } = state.enrollments;
  const params = new URLSearchParams({ page, limit });
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (grade) params.append('grade', grade);

  try {
    const res = await fetch(`/api/enrollments?${params.toString()}`);
    const result = await res.json();
    if (result.success) {
      state.enrollments.data = result.data;
      state.enrollments.pagination = result.pagination;
      renderEnrollmentsTable();
    }
  } catch (err) {
    showToast('Failed to load enrollments', 'error');
  }
}

// Render Overview Dashboard
function loadOverviewData() {
  const totalStudents = state.students.pagination.totalItems || state.students.data.length;
  const activeStudentsCount = state.students.data.filter(s => s.status === 'Active').length;
  const totalCourses = state.courses.pagination.totalItems || state.courses.data.length;
  const totalEnrollments = state.enrollments.pagination.totalItems || state.enrollments.data.length;
  const completedEnrollments = state.enrollments.data.filter(e => e.status === 'Completed').length;

  document.getElementById('stat-total-students').textContent = totalStudents;
  document.getElementById('stat-active-students').textContent = `${activeStudentsCount} Active`;

  document.getElementById('stat-total-courses').textContent = totalCourses;
  document.getElementById('stat-dept-courses').textContent = `Across ${state.departments.size} Departments`;

  document.getElementById('stat-total-enrollments').textContent = totalEnrollments;
  document.getElementById('stat-completed-enrollments').textContent = `${completedEnrollments} Completed`;

  document.getElementById('stat-total-departments').textContent = state.departments.size;

  // Recent Students
  const recentTbody = document.getElementById('recent-students-tbody');
  if (recentTbody) {
    recentTbody.innerHTML = state.students.data.slice(0, 4).map(s => `
      <tr>
        <td><code>${s.studentIdCode}</code></td>
        <td><strong>${s.firstName} ${s.lastName}</strong></td>
        <td>${s.department}</td>
        <td><span class="badge badge-${s.status.toLowerCase()}">${s.status}</span></td>
      </tr>
    `).join('') || '<tr><td colspan="4">No student records found</td></tr>';
  }

  // Course Capacity
  const capacityList = document.getElementById('course-capacity-list');
  if (capacityList) {
    capacityList.innerHTML = state.courses.data.slice(0, 4).map(c => {
      const pct = Math.round((c.enrolledCount / c.maxCapacity) * 100);
      return `
        <div class="capacity-item">
          <div class="capacity-info">
            <span><strong>${c.code}</strong> - ${c.title}</span>
            <span>${c.enrolledCount} / ${c.maxCapacity} Seats (${pct}%)</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${Math.min(100, pct)}%"></div>
          </div>
        </div>
      `;
    }).join('') || '<p>No courses available</p>';
  }
}

// Render Students Table
function renderStudentsTable() {
  const tbody = document.getElementById('students-tbody');
  if (!tbody) return;

  if (state.students.data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No students found matching criteria.</td></tr>';
    renderPagination('students-pagination', state.students.pagination, (p) => { state.students.page = p; fetchStudents(); });
    return;
  }

  tbody.innerHTML = state.students.data.map(s => `
    <tr>
      <td><code>${s.studentIdCode}</code></td>
      <td><strong>${s.firstName} ${s.lastName}</strong></td>
      <td>${s.email}</td>
      <td>${s.department}</td>
      <td>${s.enrollmentYear}</td>
      <td><span class="badge badge-${s.status.toLowerCase()}">${s.status}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editStudent('${s.id}')">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}', '${s.firstName} ${s.lastName}')">🗑️</button>
      </td>
    </tr>
  `).join('');

  renderPagination('students-pagination', state.students.pagination, (p) => {
    state.students.page = p;
    fetchStudents();
  });
}

// Render Courses Table
function renderCoursesTable() {
  const tbody = document.getElementById('courses-tbody');
  if (!tbody) return;

  if (state.courses.data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No courses found.</td></tr>';
    renderPagination('courses-pagination', state.courses.pagination, (p) => { state.courses.page = p; fetchCourses(); });
    return;
  }

  tbody.innerHTML = state.courses.data.map(c => `
    <tr>
      <td><code>${c.code}</code></td>
      <td><strong>${c.title}</strong></td>
      <td>${c.credits} Credits</td>
      <td>${c.instructor}</td>
      <td>${c.department}</td>
      <td>
        <span>${c.enrolledCount} / ${c.maxCapacity} Enrolled</span>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${Math.min(100, Math.round((c.enrolledCount / c.maxCapacity) * 100))}%"></div>
        </div>
      </td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editCourse('${c.id}')">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCourse('${c.id}', '${c.code}')">🗑️</button>
      </td>
    </tr>
  `).join('');

  renderPagination('courses-pagination', state.courses.pagination, (p) => {
    state.courses.page = p;
    fetchCourses();
  });
}

// Render Enrollments Table
function renderEnrollmentsTable() {
  const tbody = document.getElementById('enrollments-tbody');
  if (!tbody) return;

  if (state.enrollments.data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No enrollment records found.</td></tr>';
    renderPagination('enrollments-pagination', state.enrollments.pagination, (p) => { state.enrollments.page = p; fetchEnrollments(); });
    return;
  }

  tbody.innerHTML = state.enrollments.data.map(e => `
    <tr>
      <td>
        <strong>${e.student ? e.student.firstName + ' ' + e.student.lastName : 'N/A'}</strong><br>
        <small class="text-muted"><code>${e.student ? e.student.studentIdCode : ''}</code></small>
      </td>
      <td>
        <strong>${e.course ? e.course.code : 'N/A'}</strong> - ${e.course ? e.course.title : ''}<br>
        <small class="text-muted">${e.course ? e.course.department : ''}</small>
      </td>
      <td>${e.enrollmentDate}</td>
      <td><span class="badge badge-${e.status.toLowerCase()}">${e.status}</span></td>
      <td><strong>${e.grade}</strong></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editEnrollment('${e.id}', '${e.status}', '${e.grade}')">✏️ Grade/Status</button>
        <button class="btn btn-danger btn-sm" onclick="deleteEnrollment('${e.id}')">🗑️ Drop</button>
      </td>
    </tr>
  `).join('');

  renderPagination('enrollments-pagination', state.enrollments.pagination, (p) => {
    state.enrollments.page = p;
    fetchEnrollments();
  });
}

// Render Pagination Controls
function renderPagination(elementId, pagination, onPageChange) {
  const container = document.getElementById(elementId);
  if (!container || !pagination) return;

  const { currentPage, totalPages, totalItems } = pagination;
  if (!totalPages) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <span>Showing page ${currentPage} of ${totalPages} (${totalItems} total records)</span>
    <div class="pagination-controls">
      <button class="btn btn-secondary btn-sm" ${currentPage <= 1 ? 'disabled' : ''} id="${elementId}-prev">← Prev</button>
      <button class="btn btn-secondary btn-sm" ${currentPage >= totalPages ? 'disabled' : ''} id="${elementId}-next">Next →</button>
    </div>
  `;

  document.getElementById(`${elementId}-prev`).addEventListener('click', () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  });
  document.getElementById(`${elementId}-next`).addEventListener('click', () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  });
}

// Modal Handlers
function openModal(title, contentHtml) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = contentHtml;
  document.getElementById('modal-backdrop').classList.add('show');
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('show');
}

// Student Modal (Add/Edit)
function openStudentModal(student = null) {
  const isEdit = !!student;
  const title = isEdit ? 'Edit Student Details' : 'Add New Student';

  const html = `
    <form id="student-form">
      <div class="form-group">
        <label>Student ID Code (Optional)</label>
        <input type="text" name="studentIdCode" class="form-control" placeholder="e.g. STU20260099 (Auto-generated if empty)" value="${student ? student.studentIdCode : ''}">
      </div>
      <div class="form-row">
        <div class="form-group flex-1">
          <label>First Name *</label>
          <input type="text" name="firstName" class="form-control" required value="${student ? student.firstName : ''}">
        </div>
        <div class="form-group flex-1">
          <label>Last Name *</label>
          <input type="text" name="lastName" class="form-control" required value="${student ? student.lastName : ''}">
        </div>
      </div>
      <div class="form-group">
        <label>Email Address *</label>
        <input type="email" name="email" class="form-control" required value="${student ? student.email : ''}">
      </div>
      <div class="form-row">
        <div class="form-group flex-1">
          <label>Phone Number</label>
          <input type="text" name="phone" class="form-control" value="${student ? student.phone || '' : ''}">
        </div>
        <div class="form-group flex-1">
          <label>Date of Birth *</label>
          <input type="date" name="dateOfBirth" class="form-control" required value="${student ? student.dateOfBirth : '2002-01-01'}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group flex-1">
          <label>Department *</label>
          <input type="text" name="department" class="form-control" required placeholder="e.g. Computer Science" value="${student ? student.department : ''}">
        </div>
        <div class="form-group flex-1">
          <label>Enrollment Year *</label>
          <input type="number" name="enrollmentYear" class="form-control" required min="2000" max="2100" value="${student ? student.enrollmentYear : 2026}">
        </div>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select name="status" class="form-select" style="width:100%;">
          <option value="Active" ${student && student.status === 'Active' ? 'selected' : ''}>Active</option>
          <option value="Inactive" ${student && student.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
          <option value="Graduated" ${student && student.status === 'Graduated' ? 'selected' : ''}>Graduated</option>
          <option value="Suspended" ${student && student.status === 'Suspended' ? 'selected' : ''}>Suspended</option>
        </select>
      </div>
      <div style="text-align:right; margin-top:20px;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Student'}</button>
      </div>
    </form>
  `;

  openModal(title, html);

  document.getElementById('student-form').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    const url = isEdit ? `/api/students/${student.id}` : '/api/students';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.success) {
        showToast(result.message, 'success');
        closeModal();
        fetchStudents();
        loadOverviewData();
      } else {
        const errorMsg = result.errors ? result.errors.map(err => err.message).join('<br>') : result.message;
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      showToast('Error saving student', 'error');
    }
  };
}

async function editStudent(id) {
  try {
    const res = await fetch(`/api/students/${id}`);
    const result = await res.json();
    if (result.success) {
      openStudentModal(result.data);
    }
  } catch (err) {
    showToast('Failed to fetch student details', 'error');
  }
}

async function deleteStudent(id, name) {
  if (confirm(`Are you sure you want to delete student '${name}'?`)) {
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        showToast(result.message, 'success');
        fetchStudents();
        loadOverviewData();
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) {
      showToast('Error deleting student', 'error');
    }
  }
}

// Course Modal (Add/Edit)
function openCourseModal(course = null) {
  const isEdit = !!course;
  const title = isEdit ? 'Edit Course Details' : 'Add New Course';

  const html = `
    <form id="course-form">
      <div class="form-row">
        <div class="form-group flex-1">
          <label>Course Code *</label>
          <input type="text" name="code" class="form-control" required placeholder="e.g. CS101" value="${course ? course.code : ''}">
        </div>
        <div class="form-group flex-2">
          <label>Course Title *</label>
          <input type="text" name="title" class="form-control" required placeholder="e.g. Data Structures" value="${course ? course.title : ''}">
        </div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea name="description" class="form-control" rows="2">${course ? course.description || '' : ''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group flex-1">
          <label>Credits (1-10) *</label>
          <input type="number" name="credits" class="form-control" required min="1" max="10" value="${course ? course.credits : 3}">
        </div>
        <div class="form-group flex-1">
          <label>Max Capacity *</label>
          <input type="number" name="maxCapacity" class="form-control" required min="1" value="${course ? course.maxCapacity : 30}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group flex-1">
          <label>Instructor *</label>
          <input type="text" name="instructor" class="form-control" required value="${course ? course.instructor : ''}">
        </div>
        <div class="form-group flex-1">
          <label>Department *</label>
          <input type="text" name="department" class="form-control" required value="${course ? course.department : ''}">
        </div>
      </div>
      <div style="text-align:right; margin-top:20px;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Course'}</button>
      </div>
    </form>
  `;

  openModal(title, html);

  document.getElementById('course-form').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    const url = isEdit ? `/api/courses/${course.id}` : '/api/courses';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.success) {
        showToast(result.message, 'success');
        closeModal();
        fetchCourses();
        loadOverviewData();
      } else {
        const errorMsg = result.errors ? result.errors.map(err => err.message).join('<br>') : result.message;
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      showToast('Error saving course', 'error');
    }
  };
}

async function editCourse(id) {
  try {
    const res = await fetch(`/api/courses/${id}`);
    const result = await res.json();
    if (result.success) {
      openCourseModal(result.data);
    }
  } catch (err) {
    showToast('Failed to fetch course details', 'error');
  }
}

async function deleteCourse(id, code) {
  if (confirm(`Are you sure you want to delete course '${code}'?`)) {
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        showToast(result.message, 'success');
        fetchCourses();
        loadOverviewData();
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) {
      showToast('Error deleting course', 'error');
    }
  }
}

// Enrollment Modal (Add/Edit)
async function openEnrollmentModal() {
  // Fetch active students & courses for options
  let studentOpts = '';
  let courseOpts = '';

  try {
    const [stRes, crRes] = await Promise.all([
      fetch('/api/students?limit=100&status=Active').then(r => r.json()),
      fetch('/api/courses?limit=100').then(r => r.json())
    ]);

    if (stRes.success) {
      studentOpts = stRes.data.map(s => `<option value="${s.id}">${s.firstName} ${s.lastName} (${s.studentIdCode} - ${s.department})</option>`).join('');
    }
    if (crRes.success) {
      courseOpts = crRes.data.map(c => `<option value="${c.id}">${c.code} - ${c.title} (${c.enrolledCount}/${c.maxCapacity} Seats)</option>`).join('');
    }
  } catch (err) {
    showToast('Error fetching options for enrollment', 'error');
  }

  const html = `
    <form id="enrollment-form">
      <div class="form-group">
        <label>Select Active Student *</label>
        <select name="studentId" class="form-select" style="width:100%;" required>
          <option value="">-- Choose Student --</option>
          ${studentOpts}
        </select>
      </div>
      <div class="form-group">
        <label>Select Course *</label>
        <select name="courseId" class="form-select" style="width:100%;" required>
          <option value="">-- Choose Course --</option>
          ${courseOpts}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group flex-1">
          <label>Status</label>
          <select name="status" class="form-select" style="width:100%;">
            <option value="Enrolled">Enrolled</option>
            <option value="Completed">Completed</option>
            <option value="Dropped">Dropped</option>
          </select>
        </div>
        <div class="form-group flex-1">
          <label>Grade</label>
          <select name="grade" class="form-select" style="width:100%;">
            <option value="Pending">Pending</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="F">F</option>
          </select>
        </div>
      </div>
      <div style="text-align:right; margin-top:20px;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Enroll Student</button>
      </div>
    </form>
  `;

  openModal('Enroll Student in Course', html);

  document.getElementById('enrollment-form').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.success) {
        showToast(result.message, 'success');
        closeModal();
        fetchEnrollments();
        loadOverviewData();
      } else {
        const errorMsg = result.errors ? result.errors.map(err => err.message).join('<br>') : result.message;
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      showToast('Error processing enrollment', 'error');
    }
  };
}

function editEnrollment(id, currentStatus, currentGrade) {
  const html = `
    <form id="edit-enrollment-form">
      <div class="form-group">
        <label>Status</label>
        <select name="status" class="form-select" style="width:100%;">
          <option value="Enrolled" ${currentStatus === 'Enrolled' ? 'selected' : ''}>Enrolled</option>
          <option value="Completed" ${currentStatus === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Dropped" ${currentStatus === 'Dropped' ? 'selected' : ''}>Dropped</option>
        </select>
      </div>
      <div class="form-group">
        <label>Grade</label>
        <select name="grade" class="form-select" style="width:100%;">
          <option value="Pending" ${currentGrade === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="A" ${currentGrade === 'A' ? 'selected' : ''}>A</option>
          <option value="B" ${currentGrade === 'B' ? 'selected' : ''}>B</option>
          <option value="C" ${currentGrade === 'C' ? 'selected' : ''}>C</option>
          <option value="D" ${currentGrade === 'D' ? 'selected' : ''}>D</option>
          <option value="F" ${currentGrade === 'F' ? 'selected' : ''}>F</option>
        </select>
      </div>
      <div style="text-align:right; margin-top:20px;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Update Record</button>
      </div>
    </form>
  `;

  openModal('Update Enrollment Status / Grade', html);

  document.getElementById('edit-enrollment-form').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`/api/enrollments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.success) {
        showToast(result.message, 'success');
        closeModal();
        fetchEnrollments();
        loadOverviewData();
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) {
      showToast('Error updating enrollment', 'error');
    }
  };
}

async function deleteEnrollment(id) {
  if (confirm('Are you sure you want to drop/delete this enrollment record?')) {
    try {
      const res = await fetch(`/api/enrollments/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        showToast(result.message, 'success');
        fetchEnrollments();
        loadOverviewData();
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) {
      showToast('Error deleting enrollment', 'error');
    }
  }
}

// Department Filters Auto-Population
function populateDepartmentFilters() {
  const depts = Array.from(state.departments);
  const studentSelect = document.getElementById('students-dept-filter');
  const courseSelect = document.getElementById('courses-dept-filter');

  const options = '<option value="">All Departments</option>' + depts.map(d => `<option value="${d}">${d}</option>`).join('');
  if (studentSelect) studentSelect.innerHTML = options;
  if (courseSelect) courseSelect.innerHTML = options;
}

// API Tester Handler
async function handleApiTesterSend() {
  const method = document.getElementById('api-test-method').value;
  const url = document.getElementById('api-test-url').value;
  const bodyText = document.getElementById('api-test-body').value.trim();
  const outputEl = document.getElementById('api-response-output');
  const badgeEl = document.getElementById('response-status-badge');

  outputEl.textContent = '// Sending request...';
  badgeEl.textContent = 'Loading...';
  badgeEl.className = 'badge';

  const options = { method, headers: {} };

  if (['POST', 'PUT', 'PATCH'].includes(method) && bodyText) {
    options.headers['Content-Type'] = 'application/json';
    try {
      options.body = JSON.stringify(JSON.parse(bodyText));
    } catch (err) {
      outputEl.textContent = '❌ Invalid JSON in Request Payload';
      badgeEl.textContent = 'Client JSON Error';
      badgeEl.className = 'badge badge-inactive';
      return;
    }
  }

  const startTime = performance.now();
  try {
    const res = await fetch(url, options);
    const duration = Math.round(performance.now() - startTime);
    const json = await res.json();

    badgeEl.textContent = `${res.status} ${res.statusText} (${duration}ms)`;
    badgeEl.className = res.ok ? 'badge badge-active' : 'badge badge-inactive';

    outputEl.textContent = JSON.stringify(json, null, 2);
  } catch (err) {
    badgeEl.textContent = 'Network / Server Error';
    badgeEl.className = 'badge badge-inactive';
    outputEl.textContent = `Error: ${err.message}`;
  }
}

// Utility: Toast Banners
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Utility: Debounce
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
