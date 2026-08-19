const { Question, Option, Quiz } = require('../models');

// POST /api/quizzes/:quizId/questions - Add question with options (Admin only)
exports.addQuestion = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { questionText, questionType, marks, negativeMarks, explanation, options } = req.body;

    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (!questionText) {
      return res.status(400).json({ message: 'Question text is required' });
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: 'At least two options are required for a question' });
    }

    const hasCorrectOption = options.some((opt) => opt.isCorrect === true || opt.isCorrect === 'true');
    if (!hasCorrectOption) {
      return res.status(400).json({ message: 'At least one option must be marked as correct' });
    }

    const question = await Question.create({
      quizId: parseInt(quizId, 10),
      questionText,
      questionType: questionType || 'MULTIPLE_CHOICE',
      marks: marks !== undefined ? parseFloat(marks) : 1.0,
      negativeMarks: negativeMarks !== undefined ? parseFloat(negativeMarks) : 0.0,
      explanation: explanation || '',
    });

    const createdOptions = [];
    for (const opt of options) {
      const createdOpt = await Option.create({
        questionId: question.id,
        optionText: opt.optionText,
        isCorrect: opt.isCorrect === true || opt.isCorrect === 'true',
      });
      createdOptions.push(createdOpt);
    }

    return res.status(201).json({
      message: 'Question added successfully',
      question: {
        ...question.toJSON(),
        options: createdOptions,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error adding question', error: error.message });
  }
};

// PUT /api/questions/:id - Edit question and options (Admin only)
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { questionText, questionType, marks, negativeMarks, explanation, options } = req.body;

    const question = await Question.findByPk(id, { include: [{ model: Option, as: 'options' }] });
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    await question.update({
      questionText: questionText !== undefined ? questionText : question.questionText,
      questionType: questionType !== undefined ? questionType : question.questionType,
      marks: marks !== undefined ? parseFloat(marks) : question.marks,
      negativeMarks: negativeMarks !== undefined ? parseFloat(negativeMarks) : question.negativeMarks,
      explanation: explanation !== undefined ? explanation : question.explanation,
    });

    if (options && Array.isArray(options)) {
      // Remove existing options and re-create
      await Option.destroy({ where: { questionId: question.id } });
      const updatedOptions = [];
      for (const opt of options) {
        const createdOpt = await Option.create({
          questionId: question.id,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect === true || opt.isCorrect === 'true',
        });
        updatedOptions.push(createdOpt);
      }
    }

    const reloadedQuestion = await Question.findByPk(id, { include: [{ model: Option, as: 'options' }] });
    return res.json({ message: 'Question updated successfully', question: reloadedQuestion });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating question', error: error.message });
  }
};

// DELETE /api/questions/:id - Delete question (Admin only)
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByPk(id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    await question.destroy();
    return res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting question', error: error.message });
  }
};
