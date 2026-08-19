const { Quiz, Question, Option, QuizAttempt, AttemptAnswer, User } = require('../models');

// POST /api/quizzes/:id/submit - Submit quiz answers & auto-calculate score
exports.submitQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, timeTakenSeconds } = req.body; // answers: [{ questionId, selectedOptionId }]
    const userId = req.user.id;

    const quiz = await Quiz.findByPk(id, {
      include: [
        {
          model: Question,
          as: 'questions',
          include: [{ model: Option, as: 'options' }],
        },
      ],
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Invalid payload: answers array required' });
    }

    let totalScore = 0;
    let totalPossibleMarks = 0;
    const processedAnswers = [];

    // Map answers by questionId for quick lookup
    const answerMap = new Map();
    answers.forEach((ans) => {
      if (ans.questionId) {
        answerMap.set(parseInt(ans.questionId, 10), ans.selectedOptionId ? parseInt(ans.selectedOptionId, 10) : null);
      }
    });

    for (const question of quiz.questions) {
      totalPossibleMarks += question.marks;

      const selectedOptId = answerMap.get(question.id) || null;
      let isCorrect = false;
      let marksAwarded = 0;

      if (selectedOptId !== null) {
        // Find selected option
        const selectedOption = question.options.find((opt) => opt.id === selectedOptId);
        if (selectedOption && selectedOption.isCorrect) {
          isCorrect = true;
          marksAwarded = question.marks;
        } else {
          // Wrong answer logic - check for negative marking
          isCorrect = false;
          if (quiz.negativeMarking) {
            const deduction = question.negativeMarks > 0 ? question.negativeMarks : quiz.negativeMarkValue;
            marksAwarded = -Math.abs(deduction);
          } else {
            marksAwarded = 0;
          }
        }
      } else {
        // Skipped question
        isCorrect = false;
        marksAwarded = 0;
      }

      totalScore += marksAwarded;

      processedAnswers.push({
        questionId: question.id,
        selectedOptionId: selectedOptId,
        isCorrect,
        marksAwarded,
      });
    }

    // Ensure total score is non-negative if total minimum capped at 0
    const finalScore = Math.max(0, totalScore);
    const percentage = totalPossibleMarks > 0 ? parseFloat(((finalScore / totalPossibleMarks) * 100).toFixed(2)) : 0;
    const passed = percentage >= quiz.passPercentage;

    // Create Attempt record
    const attempt = await QuizAttempt.create({
      userId,
      quizId: quiz.id,
      score: finalScore,
      totalMarks: totalPossibleMarks,
      percentage,
      passed,
      timeTakenSeconds: timeTakenSeconds ? parseInt(timeTakenSeconds, 10) : 0,
      completedAt: new Date(),
    });

    // Create AttemptAnswer details
    const attemptAnswersToCreate = processedAnswers.map((pa) => ({
      attemptId: attempt.id,
      questionId: pa.questionId,
      selectedOptionId: pa.selectedOptionId,
      isCorrect: pa.isCorrect,
      marksAwarded: pa.marksAwarded,
    }));

    await AttemptAnswer.bulkCreate(attemptAnswersToCreate);

    return res.status(201).json({
      message: 'Quiz submitted successfully',
      attemptId: attempt.id,
      result: {
        score: finalScore,
        totalMarks: totalPossibleMarks,
        percentage,
        passed,
        passPercentage: quiz.passPercentage,
        timeTakenSeconds: attempt.timeTakenSeconds,
        completedAt: attempt.completedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error submitting quiz', error: error.message });
  }
};

// GET /api/attempts/my-history - Retrieve user's quiz attempt history
exports.getUserHistory = async (req, res) => {
  try {
    const attempts = await QuizAttempt.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['id', 'title', 'category', 'passPercentage'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json(attempts);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
};

// GET /api/attempts/:id/result - Retrieve detailed result breakdown for a specific attempt
exports.getAttemptResult = async (req, res) => {
  try {
    const { id } = req.params;

    const attempt = await QuizAttempt.findByPk(id, {
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['id', 'title', 'category', 'passPercentage', 'negativeMarking', 'negativeMarkValue'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: AttemptAnswer,
          as: 'answers',
          include: [
            {
              model: Question,
              as: 'question',
              include: [
                {
                  model: Option,
                  as: 'options',
                  attributes: ['id', 'optionText', 'isCorrect'],
                },
              ],
            },
            {
              model: Option,
              as: 'selectedOption',
              attributes: ['id', 'optionText'],
            },
          ],
        },
      ],
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt record not found' });
    }

    // Authorization check: User can only see their own attempt, or Admin can see any
    if (attempt.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied to this attempt result' });
    }

    return res.json(attempt);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching attempt result', error: error.message });
  }
};
