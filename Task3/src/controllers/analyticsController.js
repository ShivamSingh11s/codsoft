const { QuizAttempt, Quiz, User, Question, sequelize } = require('../models');

// GET /api/quizzes/:id/leaderboard - Retrieve top rankings for a specific quiz
exports.getQuizLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findByPk(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const leaderboard = await QuizAttempt.findAll({
      where: { quizId: id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [
        ['score', 'DESC'],
        ['timeTakenSeconds', 'ASC'],
        ['completedAt', 'ASC'],
      ],
      limit: 20,
    });

    return res.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        category: quiz.category,
      },
      leaderboard,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
  }
};

// GET /api/stats/user - Performance stats for logged-in user
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const attempts = await QuizAttempt.findAll({
      where: { userId },
      include: [{ model: Quiz, as: 'quiz', attributes: ['title', 'category'] }],
      order: [['completedAt', 'ASC']],
    });

    const totalAttempts = attempts.length;
    const passedAttempts = attempts.filter((a) => a.passed).length;
    const passRate = totalAttempts > 0 ? parseFloat(((passedAttempts / totalAttempts) * 100).toFixed(1)) : 0;
    
    const avgPercentage = totalAttempts > 0
      ? parseFloat((attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts).toFixed(1))
      : 0;

    const highestScorePercentage = totalAttempts > 0
      ? Math.max(...attempts.map((a) => a.percentage))
      : 0;

    const historyTrend = attempts.map((a) => ({
      attemptId: a.id,
      quizTitle: a.quiz ? a.quiz.title : 'Quiz',
      score: a.score,
      totalMarks: a.totalMarks,
      percentage: a.percentage,
      passed: a.passed,
      date: a.completedAt,
    }));

    return res.json({
      totalAttempts,
      passedAttempts,
      failedAttempts: totalAttempts - passedAttempts,
      passRate,
      avgPercentage,
      highestScorePercentage,
      historyTrend,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching user statistics', error: error.message });
  }
};

// GET /api/stats/admin - Platform-wide statistics (Admin only)
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.count({ where: { role: 'USER' } });
    const totalQuizzes = await Quiz.count();
    const totalAttempts = await QuizAttempt.count();
    const passedAttempts = await QuizAttempt.count({ where: { passed: true } });

    const globalPassRate = totalAttempts > 0
      ? parseFloat(((passedAttempts / totalAttempts) * 100).toFixed(1))
      : 0;

    // Top quizzes by attempts
    const popularQuizzes = await Quiz.findAll({
      attributes: ['id', 'title', 'category', 'isPublished'],
      include: [
        {
          model: QuizAttempt,
          as: 'attempts',
          attributes: ['id'],
        },
      ],
    });

    const formattedPopular = popularQuizzes
      .map((q) => ({
        id: q.id,
        title: q.title,
        category: q.category,
        isPublished: q.isPublished,
        attemptCount: q.attempts ? q.attempts.length : 0,
      }))
      .sort((a, b) => b.attemptCount - a.attemptCount)
      .slice(0, 5);

    return res.json({
      totalUsers,
      totalQuizzes,
      totalAttempts,
      passedAttempts,
      globalPassRate,
      popularQuizzes: formattedPopular,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching admin statistics', error: error.message });
  }
};

// GET /api/attempts/:id/certificate - Check eligibility & return Certificate payload
exports.getCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    const attempt = await QuizAttempt.findByPk(id, {
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['id', 'title', 'category', 'passPercentage'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt record not found' });
    }

    if (attempt.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied to certificate' });
    }

    if (!attempt.passed) {
      return res.status(400).json({
        eligible: false,
        message: `Certificate not available. Minimum required score is ${attempt.quiz.passPercentage}%, but you scored ${attempt.percentage}%.`,
      });
    }

    // Generate unique Certificate Serial Number
    const certificateNo = `CERT-${attempt.quiz.id}-${attempt.id}-${Math.floor(1000 + Math.random() * 9000)}`;

    return res.json({
      eligible: true,
      certificate: {
        certificateNumber: certificateNo,
        recipientName: attempt.user.name,
        recipientEmail: attempt.user.email,
        quizTitle: attempt.quiz.title,
        category: attempt.quiz.category,
        percentage: attempt.percentage,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        issuedDate: attempt.completedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error processing certificate', error: error.message });
  }
};
