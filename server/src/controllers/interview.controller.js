import * as interviewService from '../services/interview.service.js';

export const startInterview = async (req, res, next) => {
  try {
    const {
      role,
      resumeText,
      totalQuestions,
      companyTrack,
      interviewerPersona,
      jobDescription,
      pressureMode,
      isSuperday,
    } = req.body;

    if (!role) {
      return res
        .status(400)
        .json({ success: false, message: 'Please select a role for the interview.' });
    }
    if (!resumeText) {
      return res
        .status(400)
        .json({ success: false, message: 'Please upload your resume first.' });
    }

    const result = await interviewService.startInterview(
      req.user._id,
      role,
      resumeText,
      req.user.name,
      totalQuestions || 5,
      companyTrack || 'General',
      interviewerPersona || 'Natalie',
      jobDescription || '',
      Boolean(pressureMode),
      Boolean(isSuperday)
    );

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getInterview = async (req, res, next) => {
  try {
    const result = await interviewService.getInterviewById(req.params.id, req.user._id);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const submitAnswer = async (req, res, next) => {
  try {
    const { answer, candidateAudio } = req.body;
    const result = await interviewService.answerQuestion(
      req.params.id,
      req.user._id,
      answer || '',
      candidateAudio || null
    );
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const submitCode = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    const result = await interviewService.evaluateCodeSubmission(
      req.params.id,
      req.user._id,
      code,
      language
    );
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const endInterview = async (req, res, next) => {
  try {
    const result = await interviewService.endInterview(req.params.id, req.user._id);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const transcribeAudio = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res
        .status(400)
        .json({ success: false, message: 'No audio file provided' });
    }

    const { transcribeAudioBuffer } = await import(
      '../services/assemblyai.service.js'
    );
    const text = await transcribeAudioBuffer(req.file.buffer);
    return res.json({ success: true, data: { text } });
  } catch (error) {
    next(error);
  }
};

export const auditWhiteboard = async (req, res, next) => {
  try {
    const result = await interviewService.auditSystemDesign(
      req.params.id,
      req.user._id,
      req.body
    );
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const optimizeResume = async (req, res, next) => {
  try {
    const { resumeText, targetRole } = req.body;
    const result = await interviewService.optimizeResume(resumeText, targetRole);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const shareInterview = async (req, res, next) => {
  try {
    const result = await interviewService.generateShareToken(req.params.id, req.user._id);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getSharedInterview = async (req, res, next) => {
  try {
    const result = await interviewService.getSharedInterview(req.params.token);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const result = await interviewService.updateUserGoal(req.user._id, req.body);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const clarifyQuestion = async (req, res, next) => {
  try {
    const { questionText } = req.body;
    if (!questionText) {
      return res.status(400).json({ success: false, message: 'Clarification question text is required.' });
    }
    const result = await interviewService.clarifyQuestion(
      req.params.id,
      req.user._id,
      questionText
    );
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const saveVisionMetrics = async (req, res, next) => {
  try {
    const result = await interviewService.saveVisionMetrics(
      req.params.id,
      req.user._id,
      req.body
    );
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const auditStarStory = async (req, res, next) => {
  try {
    const result = await interviewService.auditStarStory(req.body);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getStarStories = async (req, res, next) => {
  try {
    const result = await interviewService.getStarStories(req.user._id);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const saveStarStory = async (req, res, next) => {
  try {
    const result = await interviewService.saveStarStory(req.user._id, req.body);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const deleteStarStory = async (req, res, next) => {
  try {
    const result = await interviewService.deleteStarStory(req.user._id, req.params.storyId);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const simulateNegotiation = async (req, res, next) => {
  try {
    const result = await interviewService.simulateNegotiation(req.body);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};