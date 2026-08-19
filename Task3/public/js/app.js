// Main SPA Application Controller
const app = {
  currentView: 'quizzes',
  allQuizzes: [],
  currentUser: null,
  authTab: 'login',
  chartInstance: null,

  async init() {
    this.currentUser = API.getUser();
    this.updateUserUI();

    // Check auth validity if token exists
    if (API.getToken()) {
      try {
        const res = await API.getMe();
        this.currentUser = res.user;
        API.setUser(res.user);
        this.updateUserUI();
      } catch (err) {
        API.setToken(null);
        API.setUser(null);
        this.currentUser = null;
        this.updateUserUI();
      }
    }

    this.showView('quizzes');
  },

  updateUserUI() {
    const infoText = document.getElementById('user-info-text');
    const roleBadge = document.getElementById('user-role-badge');
    const authBtn = document.getElementById('btn-auth-action');
    const adminNav = document.getElementById('nav-admin-item');
    const perfNav = document.getElementById('nav-performance-item');

    if (this.currentUser) {
      infoText.innerText = this.currentUser.name;
      roleBadge.style.display = 'inline-block';
      roleBadge.innerText = this.currentUser.role;
      roleBadge.className = `user-role-tag ${this.currentUser.role.toLowerCase()}`;
      
      authBtn.innerText = 'Logout';
      authBtn.onclick = () => this.logout();

      if (this.currentUser.role === 'ADMIN') {
        adminNav.style.display = 'inline-block';
      } else {
        adminNav.style.display = 'none';
      }
      perfNav.style.display = 'inline-block';
    } else {
      infoText.innerText = 'Guest User';
      roleBadge.style.display = 'none';
      authBtn.innerText = 'Login';
      authBtn.onclick = () => this.openAuthModal();
      adminNav.style.display = 'none';
    }
  },

  showView(viewName) {
    this.currentView = viewName;

    // Hide all view sections
    document.querySelectorAll('.view-section').forEach((sec) => {
      sec.style.display = 'none';
    });

    // Update nav link active status
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.remove('active');
    });

    // Show target section
    const targetSec = document.getElementById(`view-${viewName}`);
    if (targetSec) {
      targetSec.style.display = 'block';
    }

    // Trigger section loads
    if (viewName === 'quizzes') {
      this.loadQuizzes();
    } else if (viewName === 'leaderboard') {
      this.initLeaderboardView();
    } else if (viewName === 'performance') {
      this.loadUserPerformance();
    } else if (viewName === 'admin') {
      adminPanel.loadAdminView();
    }
  },

  async loadQuizzes() {
    try {
      this.allQuizzes = await API.getQuizzes();
      this.renderQuizzesGrid(this.allQuizzes);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    }
  },

  renderQuizzesGrid(quizzesList) {
    const grid = document.getElementById('quizzes-grid');
    grid.innerHTML = '';

    if (!quizzesList || quizzesList.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:40px;">No quizzes available at the moment.</div>`;
      return;
    }

    quizzesList.forEach((q) => {
      const card = document.createElement('div');
      card.className = 'glass-card quiz-card';

      card.innerHTML = `
        <div>
          <div class="quiz-header">
            <span class="badge badge-category">${q.category}</span>
            <h3 class="quiz-title">${q.title}</h3>
            <p class="quiz-desc">${q.description || 'No description provided.'}</p>
          </div>

          <div class="quiz-meta">
            <span class="badge badge-timer">⏱️ ${q.timeLimitMinutes > 0 ? q.timeLimitMinutes + ' mins' : 'Unlimited'}</span>
            ${q.negativeMarking ? `<span class="badge badge-negative">⚠️ Neg. Marking (-${q.negativeMarkValue})</span>` : ''}
            <span class="badge" style="background:rgba(255,255,255,0.05); color:var(--text-muted);">Pass: ${q.passPercentage}%</span>
          </div>
        </div>

        <div class="quiz-footer">
          <div style="font-size:0.85rem; color:var(--text-muted);">
            <strong>${q.questionCount}</strong> Questions • <strong>${q.totalMarks}</strong> Marks
          </div>
          <button class="btn btn-primary btn-sm" onclick="app.handleStartQuiz(${q.id})">Start Quiz →</button>
        </div>
      `;
      grid.appendChild(card);
    });
  },

  filterQuizzes() {
    const query = document.getElementById('search-quiz-input').value.toLowerCase();
    const filtered = this.allQuizzes.filter((q) => 
      q.title.toLowerCase().includes(query) || q.category.toLowerCase().includes(query)
    );
    this.renderQuizzesGrid(filtered);
  },

  handleStartQuiz(quizId) {
    if (!this.currentUser) {
      alert('Please sign in or use Quick Demo Login to start taking quizzes!');
      this.openAuthModal();
      return;
    }
    quizPlayer.start(quizId);
  },

  // Auth Modal Management
  openAuthModal() {
    document.getElementById('modal-auth').classList.add('show');
  },

  closeAuthModal() {
    document.getElementById('modal-auth').classList.remove('show');
  },

  switchAuthTab(tab) {
    this.authTab = tab;
    const tabLogin = document.getElementById('tab-login');
    const tabReg = document.getElementById('tab-register');
    const nameGroup = document.getElementById('group-name');
    const roleGroup = document.getElementById('group-role');
    const submitBtn = document.getElementById('btn-auth-submit');
    const modalTitle = document.getElementById('auth-modal-title');

    if (tab === 'register') {
      tabReg.style.background = 'var(--primary-light)';
      tabLogin.style.background = 'transparent';
      nameGroup.style.display = 'block';
      roleGroup.style.display = 'block';
      submitBtn.innerText = 'Register Account';
      modalTitle.innerText = 'Create New Account';
    } else {
      tabLogin.style.background = 'var(--primary-light)';
      tabReg.style.background = 'transparent';
      nameGroup.style.display = 'none';
      roleGroup.style.display = 'none';
      submitBtn.innerText = 'Login';
      modalTitle.innerText = 'Sign In to QuizPulse';
    }
  },

  async handleAuthSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    try {
      let res;
      if (this.authTab === 'register') {
        const name = document.getElementById('auth-name').value;
        const role = document.getElementById('auth-role').value;
        res = await API.register(name, email, password, role);
      } else {
        res = await API.login(email, password);
      }

      API.setToken(res.token);
      API.setUser(res.user);
      this.currentUser = res.user;

      this.updateUserUI();
      this.closeAuthModal();
      this.showView(this.currentUser.role === 'ADMIN' ? 'admin' : 'quizzes');
    } catch (error) {
      alert(error.message || 'Authentication failed');
    }
  },

  async quickLogin(email, password) {
    document.getElementById('auth-email').value = email;
    document.getElementById('auth-password').value = password;
    this.switchAuthTab('login');
    try {
      const res = await API.login(email, password);
      API.setToken(res.token);
      API.setUser(res.user);
      this.currentUser = res.user;

      this.updateUserUI();
      this.closeAuthModal();
      this.showView(this.currentUser.role === 'ADMIN' ? 'admin' : 'quizzes');
    } catch (error) {
      alert(error.message || 'Quick login failed');
    }
  },

  logout() {
    API.setToken(null);
    API.setUser(null);
    this.currentUser = null;
    this.updateUserUI();
    this.showView('quizzes');
  },

  // Leaderboard Logic
  async initLeaderboardView() {
    try {
      const quizzes = await API.getQuizzes();
      const select = document.getElementById('leaderboard-quiz-select');
      select.innerHTML = '';

      if (quizzes.length === 0) {
        select.innerHTML = `<option>No Quizzes Available</option>`;
        return;
      }

      quizzes.forEach((q) => {
        const opt = document.createElement('option');
        opt.value = q.id;
        opt.innerText = `${q.title} (${q.category})`;
        select.appendChild(opt);
      });

      if (quizzes.length > 0) {
        this.loadLeaderboard(quizzes[0].id);
      }
    } catch (error) {
      console.error('Error loading leaderboard quizzes:', error);
    }
  },

  async loadLeaderboard(quizId) {
    try {
      const data = await API.getLeaderboard(quizId);
      const tbody = document.getElementById('leaderboard-tbody');
      tbody.innerHTML = '';

      if (!data.leaderboard || data.leaderboard.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No attempts recorded for this quiz yet.</td></tr>`;
        return;
      }

      data.leaderboard.forEach((item, index) => {
        let rankBadge = `${index + 1}`;
        if (index === 0) rankBadge = '🥇 1st';
        if (index === 1) rankBadge = '🥈 2nd';
        if (index === 2) rankBadge = '🥉 3rd';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${rankBadge}</strong></td>
          <td>${item.user ? item.user.name : 'Participant'}</td>
          <td><strong style="color:var(--primary-glow);">${item.score} / ${item.totalMarks}</strong></td>
          <td><span class="badge ${item.passed ? 'badge-success' : 'badge-negative'}">${item.percentage}%</span></td>
          <td>⏱️ ${item.timeTakenSeconds}s</td>
          <td style="font-size:0.85rem; color:var(--text-muted);">${new Date(item.completedAt).toLocaleDateString()}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    }
  },

  // Performance Analytics & Chart.js rendering
  async loadUserPerformance() {
    if (!this.currentUser) {
      alert('Please login to view your performance metrics.');
      this.openAuthModal();
      return;
    }

    try {
      const stats = await API.getUserStats();
      document.getElementById('stat-total-attempts').innerText = stats.totalAttempts;
      document.getElementById('stat-pass-rate').innerText = `${stats.passRate}%`;
      document.getElementById('stat-avg-score').innerText = `${stats.avgPercentage}%`;

      // Render History Table
      const historyTbody = document.getElementById('history-tbody');
      historyTbody.innerHTML = '';

      if (!stats.historyTrend || stats.historyTrend.length === 0) {
        historyTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">You haven't completed any quizzes yet.</td></tr>`;
      } else {
        stats.historyTrend.forEach((item) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${item.quizTitle}</strong></td>
            <td>${item.score} / ${item.totalMarks}</td>
            <td><strong>${item.percentage}%</strong></td>
            <td><span class="badge ${item.passed ? 'badge-success' : 'badge-negative'}">${item.passed ? 'PASSED ✓' : 'FAILED ✗'}</span></td>
            <td style="font-size:0.85rem; color:var(--text-muted);">${new Date(item.date).toLocaleDateString()}</td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="quizPlayer.showResult(${item.attemptId})">Review</button>
              ${item.passed ? `<button class="btn btn-secondary btn-sm" onclick="certificate.openModal(${item.attemptId})">Certificate</button>` : ''}
            </td>
          `;
          historyTbody.appendChild(tr);
        });
      }

      // Render Chart.js
      this.renderTrendChart(stats.historyTrend || []);
    } catch (error) {
      console.error('Error loading user performance:', error);
    }
  },

  renderTrendChart(history) {
    const ctx = document.getElementById('user-trend-chart')?.getContext('2d');
    if (!ctx) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const labels = history.map((item, idx) => `Attempt ${idx + 1}`);
    const dataPoints = history.map((item) => item.percentage);

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Score Percentage (%)',
            data: dataPoints,
            borderColor: '#06B6D4',
            backgroundColor: 'rgba(6, 182, 212, 0.15)',
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#7C3AED',
            pointRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94A3B8' },
          },
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94A3B8' },
          },
        },
        plugins: {
          legend: { labels: { color: '#F8FAFC' } },
        },
      },
    });
  },
};

// Initialize App on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
