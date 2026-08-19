/**
 * ContactPulse Client-Side JavaScript
 */

const API_BASE_URL = '/api/contacts';

// State Management
const state = {
  contacts: [],
  meta: {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    searchQuery: '',
  },
  searchTimeout: null,
};

// DOM Elements
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const sortBySelect = document.getElementById('sortBySelect');
const sortOrderSelect = document.getElementById('sortOrderSelect');
const limitSelect = document.getElementById('limitSelect');
const contactsTableBody = document.getElementById('contactsTableBody');
const emptyState = document.getElementById('emptyState');
const emptyStateMsg = document.getElementById('emptyStateMsg');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const resultsCountBadge = document.getElementById('resultsCountBadge');

// Stat Cards
const statTotalContacts = document.getElementById('statTotalContacts');
const statCurrentPage = document.getElementById('statCurrentPage');
const statApiStatus = document.getElementById('statApiStatus');

// Pagination
const paginationInfo = document.getElementById('paginationInfo');
const paginationControls = document.getElementById('paginationControls');

// Modal Elements
const contactModal = document.getElementById('contactModal');
const modalTitle = document.getElementById('modalTitle');
const contactForm = document.getElementById('contactForm');
const contactIdInput = document.getElementById('contactId');
const inputName = document.getElementById('inputName');
const inputEmail = document.getElementById('inputEmail');
const inputPhone = document.getElementById('inputPhone');
const inputCompany = document.getElementById('inputCompany');
const inputAddress = document.getElementById('inputAddress');

const openAddModalBtn = document.getElementById('openAddModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const formGeneralError = document.getElementById('formGeneralError');

// Toast Container
const toastContainer = document.getElementById('toastContainer');

// Init application
document.addEventListener('DOMContentLoaded', () => {
  fetchContacts();
  setupEventListeners();
  checkApiHealth();
});

// Setup event listeners
function setupEventListeners() {
  // Search input with debounce
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    clearSearchBtn.style.display = val ? 'block' : 'none';

    clearTimeout(state.searchTimeout);
    state.searchTimeout = setTimeout(() => {
      state.meta.searchQuery = val;
      state.meta.currentPage = 1;
      fetchContacts();
    }, 350);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    state.meta.searchQuery = '';
    state.meta.currentPage = 1;
    fetchContacts();
  });

  // Sort & Limit Selectors
  sortBySelect.addEventListener('change', (e) => {
    state.meta.sortBy = e.target.value;
    fetchContacts();
  });

  sortOrderSelect.addEventListener('change', (e) => {
    state.meta.sortOrder = e.target.value;
    fetchContacts();
  });

  limitSelect.addEventListener('change', (e) => {
    state.meta.limit = parseInt(e.target.value, 10);
    state.meta.currentPage = 1;
    fetchContacts();
  });

  resetFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    state.meta.searchQuery = '';
    state.meta.sortBy = 'createdAt';
    state.meta.sortOrder = 'DESC';
    state.meta.currentPage = 1;
    sortBySelect.value = 'createdAt';
    sortOrderSelect.value = 'DESC';
    fetchContacts();
  });

  // Modal handlers
  openAddModalBtn.addEventListener('click', () => openModal('add'));
  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);

  // Form submit
  contactForm.addEventListener('submit', handleFormSubmit);

  // Close modal when clicking outside
  contactModal.addEventListener('click', (e) => {
    if (e.target === contactModal) closeModal();
  });
}

// Fetch Contacts from API
async function fetchContacts() {
  try {
    const params = new URLSearchParams({
      page: state.meta.currentPage,
      limit: state.meta.limit,
      sortBy: state.meta.sortBy,
      sortOrder: state.meta.sortOrder,
    });

    if (state.meta.searchQuery) {
      params.append('search', state.meta.searchQuery);
    }

    const res = await fetch(`${API_BASE_URL}?${params.toString()}`);
    const json = await res.json();

    if (json.success) {
      state.contacts = json.data;
      state.meta = { ...state.meta, ...json.meta };
      renderTable();
      renderPagination();
      updateStats();
    } else {
      showToast(json.message || 'Failed to fetch contacts', 'error');
    }
  } catch (err) {
    console.error('Fetch error:', err);
    showToast('Failed to connect to API server', 'error');
  }
}

// Check API Health
async function checkApiHealth() {
  try {
    const res = await fetch('/api/health');
    const json = await res.json();
    if (json.success) {
      statApiStatus.textContent = 'Online';
      statApiStatus.className = 'stat-value text-success';
    } else {
      statApiStatus.textContent = 'Issue';
      statApiStatus.className = 'stat-value text-danger';
    }
  } catch {
    statApiStatus.textContent = 'Offline';
    statApiStatus.className = 'stat-value text-danger';
  }
}

// Render Table Rows
function renderTable() {
  contactsTableBody.innerHTML = '';

  if (state.contacts.length === 0) {
    emptyState.classList.remove('hidden');
    resultsCountBadge.textContent = '0 contacts';
    if (state.meta.searchQuery) {
      emptyStateMsg.textContent = `No contacts match "${state.meta.searchQuery}". Try a different keyword or reset filters.`;
    } else {
      emptyStateMsg.textContent = 'No contacts stored yet. Click "Add New Contact" to create one.';
    }
    return;
  }

  emptyState.classList.add('hidden');
  resultsCountBadge.textContent = `${state.meta.totalItems} contact${state.meta.totalItems === 1 ? '' : 's'}`;

  state.contacts.forEach((contact) => {
    const tr = document.createElement('tr');
    const initial = contact.name ? contact.name.charAt(0).toUpperCase() : '?';

    tr.innerHTML = `
      <td>
        <div class="contact-name-cell">
          <div class="avatar">${initial}</div>
          <div>
            <div>${escapeHtml(contact.name)}</div>
            <small style="color: var(--text-muted);">Added ${new Date(contact.createdAt).toLocaleDateString()}</small>
          </div>
        </div>
      </td>
      <td><a href="mailto:${escapeHtml(contact.email)}" style="color: var(--accent-primary); text-decoration: none;">${escapeHtml(contact.email)}</a></td>
      <td>${escapeHtml(contact.phone)}</td>
      <td>${contact.company ? escapeHtml(contact.company) : '<span style="color: var(--text-muted);">-</span>'}</td>
      <td>${contact.address ? escapeHtml(contact.address) : '<span style="color: var(--text-muted);">-</span>'}</td>
      <td class="text-right">
        <div class="action-buttons">
          <button class="btn btn-sm btn-edit" onclick="editContact(${contact.id})">✏️ Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteContactPrompt(${contact.id}, '${escapeHtml(contact.name)}')">🗑️ Delete</button>
        </div>
      </td>
    `;
    contactsTableBody.appendChild(tr);
  });
}

// Render Pagination Controls
function renderPagination() {
  const { currentPage, totalPages, totalItems, limit } = state.meta;

  const start = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalItems);

  paginationInfo.textContent = `Showing ${start}-${end} of ${totalItems} contacts`;
  paginationControls.innerHTML = '';

  if (totalPages <= 1) return;

  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.textContent = '‹ Prev';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => goToPage(currentPage - 1);
  paginationControls.appendChild(prevBtn);

  // Page Numbers
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
    btn.textContent = i;
    btn.onclick = () => goToPage(i);
    paginationControls.appendChild(btn);
  }

  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.textContent = 'Next ›';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => goToPage(currentPage + 1);
  paginationControls.appendChild(nextBtn);
}

function goToPage(page) {
  state.meta.currentPage = page;
  fetchContacts();
}

function updateStats() {
  statTotalContacts.textContent = state.meta.totalItems;
  statCurrentPage.textContent = `${state.meta.currentPage} / ${state.meta.totalPages || 1}`;
}

// Open Modal (Add / Edit)
function openModal(mode, contact = null) {
  clearFormErrors();
  contactForm.reset();
  formGeneralError.classList.add('hidden');

  if (mode === 'edit' && contact) {
    modalTitle.textContent = 'Edit Contact';
    contactIdInput.value = contact.id;
    inputName.value = contact.name || '';
    inputEmail.value = contact.email || '';
    inputPhone.value = contact.phone || '';
    inputCompany.value = contact.company || '';
    inputAddress.value = contact.address || '';
  } else {
    modalTitle.textContent = 'Add New Contact';
    contactIdInput.value = '';
  }

  contactModal.classList.remove('hidden');
}

function closeModal() {
  contactModal.classList.add('hidden');
}

// Handle Form Submit (Create / Update)
async function handleFormSubmit(e) {
  e.preventDefault();
  clearFormErrors();
  formGeneralError.classList.add('hidden');

  const id = contactIdInput.value;
  const isEdit = Boolean(id);

  const payload = {
    name: inputName.value.trim(),
    email: inputEmail.value.trim(),
    phone: inputPhone.value.trim(),
    company: inputCompany.value.trim(),
    address: inputAddress.value.trim(),
  };

  const url = isEdit ? `${API_BASE_URL}/${id}` : API_BASE_URL;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (json.success) {
      showToast(isEdit ? 'Contact updated successfully!' : 'Contact added successfully!', 'success');
      closeModal();
      fetchContacts();
    } else {
      // Handle validation & duplicate errors cleanly
      if (json.errors && Array.isArray(json.errors)) {
        json.errors.forEach((err) => {
          const errSpan = document.getElementById(`error${capitalize(err.field)}`);
          if (errSpan) {
            errSpan.textContent = err.message;
          }
        });
      }
      formGeneralError.textContent = json.message || 'Error processing request.';
      formGeneralError.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Submit error:', err);
    formGeneralError.textContent = 'Network error. Please try again.';
    formGeneralError.classList.remove('hidden');
  }
}

// Global scope for onclick handlers
window.editContact = async function (id) {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`);
    const json = await res.json();
    if (json.success) {
      openModal('edit', json.data);
    } else {
      showToast(json.message || 'Contact not found', 'error');
    }
  } catch {
    showToast('Failed to load contact details', 'error');
  }
};

window.deleteContactPrompt = async function (id, name) {
  if (confirm(`Are you sure you want to delete contact "${name}"?`)) {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Contact deleted successfully', 'success');
        fetchContacts();
      } else {
        showToast(json.message || 'Failed to delete contact', 'error');
      }
    } catch {
      showToast('Network error while deleting contact', 'error');
    }
  }
};

// Clear Form Errors
function clearFormErrors() {
  document.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));
}

// Toast Notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Helpers
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
