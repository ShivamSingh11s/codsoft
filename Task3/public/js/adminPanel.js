// Admin Management Studio Controller
const adminPanel = {
  currentQuizId: null,
  currentQuestionId: null,

  async loadAdminView() {
    try {
      const stats = await API.getAdminStats();
      const quizzes = await API.getQuizzes();

      // Render Admin Stats Header
      const statsCards = document.getElementById('admin-stats-cards');
      statsCards.innerHTML = `
        <div class="glass-card">
          <div style="color:var(--text-muted); font-size:0.9rem;">Registered Users</div>
          <div style="font-size:2rem; font-weight:800; color:var(--secondary-glow); margin-top:6px;">${stats.totalUsers}</div>
        </div>
        <div class="glass-card">
          <div style="color:var(--text-muted); font-size:0.9rem;">Total Quizzes</div>
          <div style="font-size:2rem; font-weight:800; color:var(--primary-glow); margin-top:6px;">${stats.totalQuizzes}</div>
        </div>
        <div class="glass-card">
          <div style="color:var(--text-muted); font-size:0.9rem;">Total Attempts Completed</div>
          <div style="font-size:2rem; font-weight:800; color:var(--success); margin-top:6px;">${stats.totalAttempts} (Pass Rate ${stats.globalPassRate}%)</div>
        </div>
      `;

      // Render Quizzes Table
      const tbody = document.getElementById('admin-quizzes-tbody');
      tbody.innerHTML = '';

      quizzes.forEach((q) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${q.title}</strong></td>
          <td><span class="badge badge-category">${q.category}</span></td>
          <td>⏱️ ${q.timeLimitMinutes > 0 ? q.timeLimitMinutes + ' min' : 'No limit'}</td>
          <td>${q.negativeMarking ? `<span class="badge badge-negative">-${q.negativeMarkValue}</span>` : '<span style="color:var(--text-dim);">Disabled</span>'}</td>
          <td>${q.questionCount} Qs (${q.totalMarks} Marks)</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="adminPanel.openQuestionModal(${q.id})">+ Questions</button>
            <button class="btn btn-secondary btn-sm" onclick="adminPanel.editQuiz(${q.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteQuiz(${q.id})">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (error) {
      alert(error.message || 'Error loading admin data');
    }
  },

  openQuizModal(quiz = null) {
    const modal = document.getElementById('modal-quiz-editor');
    const titleElem = document.getElementById('quiz-editor-title');

    if (quiz) {
      titleElem.innerText = 'Edit Quiz Settings';
      document.getElementById('edit-quiz-id').value = quiz.id;
      document.getElementById('quiz-title-input').value = quiz.title;
      document.getElementById('quiz-desc-input').value = quiz.description || '';
      document.getElementById('quiz-cat-input').value = quiz.category || 'General';
      document.getElementById('quiz-timer-input').value = quiz.timeLimitMinutes;
      document.getElementById('quiz-pass-input').value = quiz.passPercentage;
      document.getElementById('quiz-neg-val-input').value = quiz.negativeMarkValue;
      document.getElementById('quiz-neg-toggle').checked = quiz.negativeMarking;
      document.getElementById('quiz-rand-toggle').checked = quiz.isRandomized;
    } else {
      titleElem.innerText = 'Create New Quiz';
      document.getElementById('edit-quiz-id').value = '';
      document.getElementById('quiz-title-input').value = '';
      document.getElementById('quiz-desc-input').value = '';
      document.getElementById('quiz-cat-input').value = 'General';
      document.getElementById('quiz-timer-input').value = 10;
      document.getElementById('quiz-pass-input').value = 60;
      document.getElementById('quiz-neg-val-input').value = 0.25;
      document.getElementById('quiz-neg-toggle').checked = false;
      document.getElementById('quiz-rand-toggle').checked = true;
    }

    modal.classList.add('show');
  },

  closeQuizModal() {
    document.getElementById('modal-quiz-editor').classList.remove('show');
  },

  async editQuiz(quizId) {
    try {
      const quiz = await API.getQuiz(quizId);
      this.openQuizModal(quiz);
    } catch (error) {
      alert(error.message || 'Error fetching quiz details');
    }
  },

  async saveQuiz(event) {
    event.preventDefault();
    const id = document.getElementById('edit-quiz-id').value;
    const payload = {
      title: document.getElementById('quiz-title-input').value,
      description: document.getElementById('quiz-desc-input').value,
      category: document.getElementById('quiz-cat-input').value,
      timeLimitMinutes: parseInt(document.getElementById('quiz-timer-input').value, 10),
      passPercentage: parseFloat(document.getElementById('quiz-pass-input').value),
      negativeMarking: document.getElementById('quiz-neg-toggle').checked,
      negativeMarkValue: parseFloat(document.getElementById('quiz-neg-val-input').value),
      isRandomized: document.getElementById('quiz-rand-toggle').checked,
    };

    try {
      if (id) {
        await API.updateQuiz(id, payload);
      } else {
        await API.createQuiz(payload);
      }
      this.closeQuizModal();
      this.loadAdminView();
    } catch (error) {
      alert(error.message || 'Error saving quiz');
    }
  },

  async deleteQuiz(quizId) {
    if (confirm('Are you sure you want to delete this quiz and all its questions?')) {
      try {
        await API.deleteQuiz(quizId);
        this.loadAdminView();
      } catch (error) {
        alert(error.message || 'Error deleting quiz');
      }
    }
  },

  async openQuestionModal(quizId) {
    this.currentQuizId = quizId;
    document.getElementById('q-quiz-id').value = quizId;
    document.getElementById('q-edit-id').value = '';
    document.getElementById('q-text-input').value = '';
    document.getElementById('q-marks-input').value = 1.0;
    document.getElementById('q-explanation-input').value = '';

    this.renderOptionInputs([
      { optionText: '', isCorrect: true },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
    ]);

    document.getElementById('modal-question-editor').classList.add('show');
  },

  closeQuestionModal() {
    document.getElementById('modal-question-editor').classList.remove('show');
  },

  renderOptionInputs(optionsList) {
    const container = document.getElementById('q-options-container');
    container.innerHTML = '';

    optionsList.forEach((opt, idx) => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.gap = '10px';

      div.innerHTML = `
        <input type="radio" name="q-correct-radio" class="option-radio" ${opt.isCorrect ? 'checked' : ''} value="${idx}">
        <input type="text" class="form-input q-opt-text" placeholder="Option ${idx + 1}" value="${opt.optionText}" required>
      `;
      container.appendChild(div);
    });
  },

  async saveQuestion(event) {
    event.preventDefault();
    const quizId = document.getElementById('q-quiz-id').value;
    const questionText = document.getElementById('q-text-input').value;
    const marks = parseFloat(document.getElementById('q-marks-input').value);
    const explanation = document.getElementById('q-explanation-input').value;

    const optTexts = document.querySelectorAll('.q-opt-text');
    const selectedRadioIndex = document.querySelector('input[name="q-correct-radio"]:checked')?.value;

    const options = [];
    optTexts.forEach((input, idx) => {
      options.push({
        optionText: input.value,
        isCorrect: String(idx) === String(selectedRadioIndex),
      });
    });

    const payload = {
      questionText,
      questionType: options.length === 2 && (options[0].optionText.toLowerCase() === 'true' || options[0].optionText.toLowerCase() === 'false') ? 'TRUE_FALSE' : 'MULTIPLE_CHOICE',
      marks,
      explanation,
      options,
    };

    try {
      await API.addQuestion(quizId, payload);
      alert('Question added successfully!');
      this.closeQuestionModal();
      this.loadAdminView();
    } catch (error) {
      alert(error.message || 'Error saving question');
    }
  },
};
