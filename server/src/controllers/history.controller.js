import Interview from '../models/Interview.model.js';

/**
 * GET /api/history
 * Returns paginated interview history and performance analytics
 */
export const getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };

    const total = await Interview.countDocuments(query);
    const interviews = await Interview.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate performance comparison analytics across all completed interviews
    const allCompleted = await Interview.find({
      userId: req.user._id,
      status: 'completed',
      overallScore: { $ne: null },
    })
      .sort({ createdAt: 1 }) // chronological order for comparison
      .select('role overallScore feedback createdAt totalQuestions')
      .lean();

    const scores = allCompleted.map((i) => i.overallScore).filter((s) => typeof s === 'number');
    const totalCompleted = allCompleted.length;
    const highestScore = scores.length ? Math.max(...scores) : 0;
    const lowestScore = scores.length ? Math.min(...scores) : 0;
    const averageScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    // Determine performance level category
    let performanceLevel = 'Beginner';
    if (averageScore >= 85) performanceLevel = 'Advanced / Expert';
    else if (averageScore >= 75) performanceLevel = 'Proficient';
    else if (averageScore >= 60) performanceLevel = 'Competent';
    else if (totalCompleted > 0) performanceLevel = 'Developing';

    // Calculate progression trend (comparing first half vs second half or last 3)
    let scoreProgression = 0;
    if (scores.length >= 2) {
      const recent = scores[scores.length - 1];
      const previous = scores[scores.length - 2];
      scoreProgression = recent - previous;
    }

    return res.json({
      success: true,
      data: {
        interviews,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        currentPage: page,
        analytics: {
          totalCompleted,
          averageScore,
          highestScore,
          lowestScore,
          performanceLevel,
          scoreProgression,
          scoreHistory: allCompleted.map((item) => ({
            id: item._id,
            role: item.role,
            score: item.overallScore,
            date: item.createdAt,
            assessment: item.feedback?.finalAssessment || '',
          })),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/history/:id
 * Delete a specific interview
 */
export const deleteHistoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Interview.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    return res.json({ success: true, message: 'Interview deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/history
 * Clear all interview history for user
 */
export const clearHistory = async (req, res, next) => {
  try {
    await Interview.deleteMany({ userId: req.user._id });
    return res.json({ success: true, message: 'All interview history cleared' });
  } catch (error) {
    next(error);
  }
};
