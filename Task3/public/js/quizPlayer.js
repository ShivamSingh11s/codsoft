// Interactive Quiz Player Engine with Live Countdown Timer
const quizPlayer = {
  quiz: null,
  questions: [],
  currentIndex: 0,
  answers: new Map(), // questionId -> selectedOptionId
  timerInterval: null,
  totalTimeSeconds: 0,
  remainingSeconds: 0,
  startTime: null,

  async start(quizId) {
    try {
      const data = await API.startQuiz(quizId);
      this.quiz = data.quiz;
      this.questions = data.quiz.questions || [];
      this.currentIndex = 0;
      this.answers.clear();
      this.startTime = new Date();

      if (!this.questions || this.questions.length === 0) {
        alert('This quiz does not have any questions yet.');
        return;
      }

      // Initialize Timer
      const limitMinutes = this.quiz.timeLimitMinutes || 10;
      this.totalTimeSeconds = limitMinutes > 0 ? limitMinutes * 60 : 0;
      this.remainingSeconds = this.totalTimeSeconds;

      // Update UI Header
      document.getElementById('player-quiz-title').innerText = this.quiz.title;
      
      // Start Countdown Interval if timer limit set
      if (this.timerInterval) clearInterval(this.timerInterval);
      
      if (this.totalTimeSeconds > 0) {
        document.getElementById('timer-display').style.display = 'flex';
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
          this.remainingSeconds--;
          this.updateTimerDisplay();

          if (this.remainingSeconds <= 0) {
            clearInterval(this.timerInterval);
            alert('⏱️ Time is up! Submitting your answers now.');
            this.submit();
          }
        }, 1000);
      } else {
        document.getElementById('timer-display').style.display = 'none';
      }

      // Show View
      app.showView('quiz-player');
      this.renderQuestion();
      this.renderPalette();
    } catch (error) {
      alert(error.message || 'Failed to start quiz');
    }
  },

  updateTimerDisplay() {
    const mins = Math.floor(Math.max(0, this.remainingSeconds) / 60);
    const secs = Math.max(0, this.remainingSeconds) % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const timerElem = document.getElementById('timer-text');
    const clockContainer = document.getElementById('timer-display');

    if (timerElem) timerElem.innerText = formatted;

    // Add pulse animation when under 1 minute
    if (this.remainingSeconds <= 60 && this.remainingSeconds > 0) {
      clockContainer.classList.add('warning');
    } else {
      clockContainer.classList.remove('warning');
    }
  },

  renderQuestion() {
    const currentQ = this.questions[this.currentIndex];
    if (!currentQ) return;

    document.getElementById('player-quiz-meta').innerText = `Question ${this.currentIndex + 1} of ${this.questions.length}`;
    document.getElementById('player-q-number').innerText = `Question ${this.currentIndex + 1} (${currentQ.marks} Marks)`;
    document.getElementById('player-q-text').innerText = currentQ.questionText;

    const optionsContainer = document.getElementById('player-options-container');
    optionsContainer.innerHTML = '';

    const selectedOptionId = this.answers.get(currentQ.id);

    currentQ.options.forEach((opt) => {
      const isSelected = selectedOptionId === opt.id;
      const optCard = document.createElement('div');
      optCard.className = `option-item ${isSelected ? 'selected' : ''}`;
      optCard.onclick = () => this.selectOption(currentQ.id, opt.id);

      optCard.innerHTML = `
        <input type="radio" name="question-opt" class="option-radio" ${isSelected ? 'checked' : ''}>
        <div style="font-size:1rem; color:var(--text-main);">${opt.optionText}</div>
      `;
      optionsContainer.appendChild(optCard);
    });

    // Update Navigation Buttons
    document.getElementById('btn-prev-q').style.visibility = this.currentIndex === 0 ? 'hidden' : 'visible';

    if (this.currentIndex === this.questions.length - 1) {
      document.getElementById('btn-next-q').style.display = 'none';
      document.getElementById('btn-submit-quiz').style.display = 'inline-flex';
    } else {
      document.getElementById('btn-next-q').style.display = 'inline-flex';
      document.getElementById('btn-submit-quiz').style.display = 'none';
    }

    this.renderPalette();
  },

  selectOption(questionId, optionId) {
    if (this.answers.get(questionId) === optionId) {
      // Toggle unselect if clicked again
      this.answers.delete(questionId);
    } else {
      this.answers.set(questionId, optionId);
    }
    this.renderQuestion();
  },

  renderPalette() {
    const palette = document.getElementById('player-nav-palette');
    palette.innerHTML = '';

    this.questions.forEach((q, idx) => {
      const btn = document.createElement('button');
      const isAnswered = this.answers.has(q.id);
      const isCurrent = idx === this.currentIndex;

      btn.className = `q-nav-btn ${isCurrent ? 'active' : ''} ${isAnswered ? 'answered' : ''}`;
      btn.innerText = idx + 1;
      btn.onclick = () => {
        this.currentIndex = idx;
        this.renderQuestion();
      };
      palette.appendChild(btn);
    });
  },

  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.renderQuestion();
    }
  },

  prevQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderQuestion();
    }
  },

  confirmSubmit() {
    const totalQ = this.questions.length;
    const answeredQ = this.answers.size;
    const unansweredQ = totalQ - answeredQ;

    let msg = `Are you sure you want to submit your quiz?`;
    if (unansweredQ > 0) {
      msg = `You have ${unansweredQ} unanswered question(s). Are you sure you want to submit?`;
    }

    if (confirm(msg)) {
      this.submit();
    }
  },

  async submit() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    const answersPayload = [];
    this.questions.forEach((q) => {
      answersPayload.push({
        questionId: q.id,
        selectedOptionId: this.answers.get(q.id) || null,
      });
    });

    const elapsedSeconds = this.startTime ? Math.round((new Date() - this.startTime) / 1000) : 0;

    try {
      const res = await API.submitQuiz(this.quiz.id, answersPayload, elapsedSeconds);
      this.showResult(res.attemptId);
    } catch (error) {
      alert(error.message || 'Error submitting quiz answers');
    }
  },

  async showResult(attemptId) {
    try {
      const attempt = await API.getAttemptResult(attemptId);
      
      // Update Result Header
      const statusTitle = document.getElementById('result-status-title');
      const statusBanner = document.getElementById('result-status-banner');
      const statusSub = document.getElementById('result-status-sub');
      const certBtn = document.getElementById('btn-view-certificate');

      document.getElementById('result-score-val').innerText = `${attempt.score} / ${attempt.totalMarks}`;
      document.getElementById('result-percentage-val').innerText = `${attempt.percentage}%`;

      if (attempt.passed) {
        statusBanner.innerText = '🎉';
        statusTitle.innerText = 'Congratulations! You Passed!';
        statusTitle.style.color = 'var(--success)';
        statusSub.innerText = `Great job! You met the pass criteria of ${attempt.quiz.passPercentage}%.`;
        if (certBtn) {
          certBtn.style.display = 'inline-flex';
          certBtn.setAttribute('data-attempt-id', attempt.id);
        }
      } else {
        statusBanner.innerText = '❌';
        statusTitle.innerText = 'Assessment Not Passed';
        statusTitle.style.color = 'var(--danger)';
        statusSub.innerText = `Required pass percentage was ${attempt.quiz.passPercentage}%. Keep practicing!`;
        if (certBtn) certBtn.style.display = 'none';
      }

      // Render Detailed Question Breakdown
      const breakdownContainer = document.getElementById('result-breakdown-container');
      breakdownContainer.innerHTML = '';

      attempt.answers.forEach((ans, idx) => {
        const qCard = document.createElement('div');
        qCard.className = 'glass-card';
        qCard.style.marginBottom = '16px';

        const isCorrect = ans.isCorrect;
        const selectedOptText = ans.selectedOption ? ans.selectedOption.optionText : '<em>Skipped / Not Answered</em>';
        
        // Find correct option text
        const correctOpt = ans.question.options.find((o) => o.isCorrect);
        const correctOptText = correctOpt ? correctOpt.optionText : 'N/A';

        let marksText = `+${ans.marksAwarded}`;
        if (ans.marksAwarded < 0) {
          marksText = `<span style="color:var(--danger);">${ans.marksAwarded} (Negative mark deducted)</span>`;
        }

        qCard.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-weight:700; color:var(--secondary-glow);">Q${idx + 1}. ${ans.question.questionText}</span>
            <span class="badge ${isCorrect ? 'badge-success' : 'badge-negative'}">
              ${isCorrect ? '✓ Correct (' + marksText + ')' : '✗ Incorrect (' + marksText + ')'}
            </span>
          </div>

          <div style="font-size:0.95rem; margin-top:8px;">
            <div>Your Answer: <strong>${selectedOptText}</strong></div>
            ${!isCorrect ? `<div style="color:var(--success); margin-top:4px;">Correct Answer: <strong>${correctOptText}</strong></div>` : ''}
          </div>

          ${ans.question.explanation ? `<div style="margin-top:10px; padding:10px; background:rgba(124,58,237,0.1); border-left:3px solid var(--primary-glow); font-size:0.85rem; color:var(--text-muted);"><strong>Explanation:</strong> ${ans.question.explanation}</div>` : ''}
        `;

        breakdownContainer.appendChild(qCard);
      });

      app.showView('result');
    } catch (error) {
      alert(error.message || 'Error retrieving quiz results');
    }
  },
};
