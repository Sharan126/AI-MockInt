import * as interviewService from '../services/interview.service.js';

export const startInterview = async (req, res, next) => {
  try {
    const { role, resumeText, totalQuestions } = req.body;

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
      totalQuestions || 5
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
    const { answer } = req.body;
    const result = await interviewService.answerQuestion(
      req.params.id,
      req.user._id,
      answer || ''
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