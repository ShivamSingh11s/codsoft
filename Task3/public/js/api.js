// API Helper Service
const API = {
  baseUrl: '/api',

  getToken() {
    return localStorage.getItem('quiz_jwt_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('quiz_jwt_token', token);
    } else {
      localStorage.removeItem('quiz_jwt_token');
    }
  },

  getUser() {
    const userStr = localStorage.getItem('quiz_user_data');
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('quiz_user_data', JSON.stringify(user));
    } else {
      localStorage.removeItem('quiz_user_data');
    }
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API Request Failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error.message);
      throw error;
    }
  },

  // Auth Endpoints
  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register(name, email, password, role) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  },

  getMe() {
    return this.request('/auth/me');
  },

  // Quiz Endpoints
  getQuizzes() {
    return this.request('/quizzes');
  },

  getQuiz(id) {
    return this.request(`/quizzes/${id}`);
  },

  startQuiz(id) {
    return this.request(`/quizzes/${id}/start`);
  },

  submitQuiz(id, answers, timeTakenSeconds) {
    return this.request(`/quizzes/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers, timeTakenSeconds }),
    });
  },

  createQuiz(data) {
    return this.request('/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateQuiz(id, data) {
    return this.request(`/quizzes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteQuiz(id) {
    return this.request(`/quizzes/${id}`, {
      method: 'DELETE',
    });
  },

  // Question Endpoints
  addQuestion(quizId, data) {
    return this.request(`/quizzes/${quizId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateQuestion(id, data) {
    return this.request(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteQuestion(id) {
    return this.request(`/questions/${id}`, {
      method: 'DELETE',
    });
  },

  // Results & Analytics
  getAttemptResult(attemptId) {
    return this.request(`/attempts/${attemptId}/result`);
  },

  getHistory() {
    return this.request('/attempts/my-history');
  },

  getLeaderboard(quizId) {
    return this.request(`/quizzes/${quizId}/leaderboard`);
  },

  getUserStats() {
    return this.request('/stats/user');
  },

  getAdminStats() {
    return this.request('/stats/admin');
  },

  getCertificate(attemptId) {
    return this.request(`/attempts/${attemptId}/certificate`);
  },
};
