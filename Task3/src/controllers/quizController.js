const { Quiz, Question, Option, User, QuizAttempt } = require('../models');

// GET /api/quizzes - List all published quizzes (or all if admin)
exports.getAllQuizzes = async (req, res) => {
  try {
    const isUserAdmin = req.user && req.user.role === 'ADMIN';
    const whereCondition = isUserAdmin ? {} : { isPublished: true };

    const quizzes = await Quiz.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Question,
          as: 'questions',
          attributes: ['id', 'marks'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Format response to include total question count and total marks
    const formattedQuizzes = quizzes.map((q) => {
      const qJson = q.toJSON();
      const questionCount = qJson.questions ? qJson.questions.length : 0;
      const totalMarks = qJson.questions
        ? qJson.questions.reduce((sum, item) => sum + item.marks, 0)
        : 0;

      delete qJson.questions;

      return {
        ...qJson,
        questionCount,
        totalMarks,
      };
    });

    return res.json(formattedQuizzes);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching quizzes', error: error.message });
  }
};

// GET /api/quizzes/:id - Get quiz details (with questions & options if admin, or start info)
exports.getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user && req.user.role === 'ADMIN';

    const quiz = await Quiz.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name'],
        },
        {
          model: Question,
          as: 'questions',
          include: [
            {
              model: Option,
              as: 'options',
              // Hide isCorrect unless user is admin
              attributes: isUserAdmin ? ['id', 'optionText', 'isCorrect'] : ['id', 'optionText'],
            },
          ],
        },
      ],
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (!quiz.isPublished && !isUserAdmin) {
      return res.status(403).json({ message: 'Quiz is not currently available' });
    }

    return res.json(quiz);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching quiz', error: error.message });
  }
};

// POST /api/quizzes - Create a new quiz (Admin only)
exports.createQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      timeLimitMinutes,
      negativeMarking,
      negativeMarkValue,
      passPercentage,
      isRandomized,
      isPublished,
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Quiz title is required' });
    }

    const quiz = await Quiz.create({
      title,
      description: description || '',
      category: category || 'General',
      timeLimitMinutes: timeLimitMinutes !== undefined ? parseInt(timeLimitMinutes, 10) : 10,
      negativeMarking: negativeMarking === true || negativeMarking === 'true',
      negativeMarkValue: negativeMarkValue !== undefined ? parseFloat(negativeMarkValue) : 0.25,
      passPercentage: passPercentage !== undefined ? parseFloat(passPercentage) : 60.0,
      isRandomized: isRandomized === true || isRandomized === 'true',
      isPublished: isPublished === undefined ? true : (isPublished === true || isPublished === 'true'),
      createdById: req.user.id,
    });

    return res.status(201).json({ message: 'Quiz created successfully', quiz });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating quiz', error: error.message });
  }
};

// PUT /api/quizzes/:id - Update a quiz (Admin only)
exports.updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findByPk(id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const {
      title,
      description,
      category,
      timeLimitMinutes,
      negativeMarking,
      negativeMarkValue,
      passPercentage,
      isRandomized,
      isPublished,
    } = req.body;

    await quiz.update({
      title: title !== undefined ? title : quiz.title,
      description: description !== undefined ? description : quiz.description,
      category: category !== undefined ? category : quiz.category,
      timeLimitMinutes: timeLimitMinutes !== undefined ? parseInt(timeLimitMinutes, 10) : quiz.timeLimitMinutes,
      negativeMarking: negativeMarking !== undefined ? (negativeMarking === true || negativeMarking === 'true') : quiz.negativeMarking,
      negativeMarkValue: negativeMarkValue !== undefined ? parseFloat(negativeMarkValue) : quiz.negativeMarkValue,
      passPercentage: passPercentage !== undefined ? parseFloat(passPercentage) : quiz.passPercentage,
      isRandomized: isRandomized !== undefined ? (isRandomized === true || isRandomized === 'true') : quiz.isRandomized,
      isPublished: isPublished !== undefined ? (isPublished === true || isPublished === 'true') : quiz.isPublished,
    });

    return res.json({ message: 'Quiz updated successfully', quiz });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating quiz', error: error.message });
  }
};

// DELETE /api/quizzes/:id - Delete a quiz (Admin only)
exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findByPk(id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    await quiz.destroy();
    return res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting quiz', error: error.message });
  }
};

// GET /api/quizzes/:id/start - User starts quiz (Sanitized questions & optional randomization)
exports.startQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findByPk(id, {
      include: [
        {
          model: Question,
          as: 'questions',
          include: [
            {
              model: Option,
              as: 'options',
              attributes: ['id', 'optionText'], // SECURITY: Hide isCorrect!
            },
          ],
        },
      ],
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (!quiz.isPublished && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'This quiz is not currently active' });
    }

    let questionsList = quiz.questions.map((q) => q.toJSON());

    // Apply Randomization bonus feature if enabled
    if (quiz.isRandomized) {
      // Shuffle questions array (Fisher-Yates)
      for (let i = questionsList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionsList[i], questionsList[j]] = [questionsList[j], questionsList[i]];
      }

      // Also shuffle options within each question
      questionsList = questionsList.map((q) => {
        const options = [...q.options];
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]];
        }
        return { ...q, options };
      });
    }

    const quizData = quiz.toJSON();
    quizData.questions = questionsList;

    return res.json({
      quiz: quizData,
      startedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error starting quiz', error: error.message });
  }
};
