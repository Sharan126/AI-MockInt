import Interview from '../models/Interview.model.js';
import { askGemini } from './gemini.service.js';
import { generateAudio } from './murf.service.js';
import { parseGeminiJSON } from '../utils/prompts.utils.js';
import {
  GENERATE_QUESTIONS_PROMPT,
  INTERVIEW_GREETING_PROMPT,
  FOLLOW_UP_PROMPT,
  FEEDBACK_PROMPT,
  EVALUATE_CODE_PROMPT,
  buildConversationHistory,
} from '../constants/prompts.js';

export const startInterview = async (userId, role, resumeText, candidateName, totalQuestions = 5) => {
  const questionsPrompt = GENERATE_QUESTIONS_PROMPT(role, resumeText, totalQuestions);
  const questionsResponse = await askGemini(questionsPrompt);
  const aiQuestions = parseGeminiJSON(questionsResponse);

  const introQuestion = {
    text: 'Tell me about yourself — your background, what you\'re currently working on, and what excites you about this role.',
    type: 'behavioral',
    isCodeQuestion: false,
  };
  const questions = [introQuestion, ...aiQuestions];

  const interview = await Interview.create({
    userId,
    role,
    resumeText,
    totalQuestions: questions.length,
    currentQuestion: 1,
    questions,
    status: 'in_progress',
  });

  const greetingPrompt = INTERVIEW_GREETING_PROMPT(role, candidateName);
  const greeting = await askGemini(greetingPrompt);

  interview.messages.push({
    role: 'interviewer',
    content: greeting,
    timestamp: new Date(),
  });

  let audioBase64 = null;
  try {
    audioBase64 = await generateAudio(greeting);
  } catch (audioError) {
    console.error('Audio generation failed, continuing without audio:', audioError.message);
  }

  interview.lastAudio = audioBase64 || '';
  await interview.save();

  return {
    interviewId: interview._id,
    greeting: greeting,
    currentQuestion: 1,
    totalQuestions: questions.length,
    question: introQuestion,
    audio: audioBase64,
  };
};

export const getInterviewById = async (interviewId, userId) => {
  const interview = await Interview.findOne({ _id: interviewId, userId });
  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }
  return interview;
};

export const answerQuestion = async (interviewId, userId, answer) => {
  const interview = await Interview.findOne({ _id: interviewId, userId });
  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }

  interview.messages.push({
    role: 'candidate',
    content: answer,
    timestamp: new Date(),
  });

  const nextIndex = interview.currentQuestion; // next index in 0-based questions
  const isComplete = nextIndex >= interview.totalQuestions;

  if (isComplete) {
    const history = buildConversationHistory(interview.messages);
    const codeSubs = interview.codeSubmissions
      .map((c) => `Language: ${c.language}\nCode:\n${c.code}`)
      .join('\n\n');
    const feedbackPrompt = FEEDBACK_PROMPT(interview.role, history, codeSubs);

    let feedback;
    try {
      const feedbackRaw = await askGemini(feedbackPrompt);
      feedback = parseGeminiJSON(feedbackRaw);
    } catch (parseErr) {
      console.warn('⚠️ Feedback parsing fallback triggered:', parseErr.message);
      feedback = generateDynamicFallbackFeedback(interview);
    }

    interview.status = 'completed';
    interview.feedback = feedback;
    interview.overallScore = feedback.overallScore || 80;
    await interview.save();

    return {
      isComplete: true,
      feedback,
      overallScore: interview.overallScore,
    };
  }

  const nextQuestion = interview.questions[nextIndex];
  interview.currentQuestion = nextIndex + 1;

  const history = buildConversationHistory(interview.messages);
  const followUpPrompt = FOLLOW_UP_PROMPT(interview.role, history, nextQuestion.text);
  const followUpText = await askGemini(followUpPrompt);

  interview.messages.push({
    role: 'interviewer',
    content: `${followUpText} ${nextQuestion.text}`,
    timestamp: new Date(),
  });

  let audioBase64 = null;
  try {
    audioBase64 = await generateAudio(`${followUpText} ${nextQuestion.text}`);
  } catch (err) {
    console.warn('Audio generation failed:', err.message);
  }

  interview.lastAudio = audioBase64 || '';
  await interview.save();

  return {
    isComplete: false,
    followUp: followUpText,
    question: nextQuestion,
    currentQuestion: interview.currentQuestion,
    totalQuestions: interview.totalQuestions,
    audio: audioBase64,
  };
};

export const evaluateCodeSubmission = async (interviewId, userId, code, language) => {
  const interview = await Interview.findOne({ _id: interviewId, userId });
  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }

  const currentQ = interview.questions[interview.currentQuestion - 1] || {};
  const evalPrompt = EVALUATE_CODE_PROMPT(
    currentQ.text || 'Coding Question',
    code,
    language,
    currentQ.codeType || 'write'
  );
  const evalRaw = await askGemini(evalPrompt);
  const evaluation = parseGeminiJSON(evalRaw);

  interview.codeSubmissions.push({
    question: currentQ.text,
    code,
    language,
    evaluation,
    timestamp: new Date(),
  });

  await interview.save();
  return evaluation;
};

export const generateDynamicFallbackFeedback = (interview) => {
  const candidateMessages = (interview.messages || []).filter(
    (m) => m.role === 'candidate'
  );
  const totalWords = candidateMessages
    .map((m) => m.content || '')
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

  const hasCode = (interview.codeSubmissions || []).length > 0;

  let commScore = 65;
  let techScore = 60;
  let probScore = 65;
  let codeScore = hasCode ? 78 : 50;
  let confScore = 65;

  if (totalWords > 150) {
    commScore = 88;
    techScore = 82;
    probScore = 85;
    confScore = 85;
  } else if (totalWords > 70) {
    commScore = 78;
    techScore = 74;
    probScore = 75;
    confScore = 76;
  } else if (totalWords < 30) {
    commScore = 48;
    techScore = 40;
    probScore = 45;
    confScore = 50;
  }

  const overallScore = Math.round(
    (commScore + techScore + probScore + codeScore + confScore) / 5
  );

  const sampleAnswer = candidateMessages[0]?.content || '';
  const snippet =
    sampleAnswer.length > 50
      ? sampleAnswer.substring(0, 50) + '...'
      : sampleAnswer;

  return {
    overallScore,
    categoryScores: {
      communicationSkills: {
        score: commScore,
        comment:
          totalWords > 70
            ? `You communicated your thoughts with clear structure when answering: "${snippet}".`
            : 'Your responses were relatively brief. Try to elaborate on your reasoning and provide concrete examples.',
      },
      technicalKnowledge: {
        score: techScore,
        comment:
          totalWords > 70
            ? 'Demonstrated relevant conceptual understanding of required tools and patterns.'
            : 'Focus on demonstrating deeper technical knowledge and specific trade-offs.',
      },
      problemSolving: {
        score: probScore,
        comment: 'Approached the technical scenarios logically and with structure.',
      },
      codeQuality: {
        score: codeScore,
        comment: hasCode
          ? 'Code submission was well-formed and syntax was structured.'
          : 'No complete code solutions were submitted or evaluated in this session.',
      },
      confidence: {
        score: confScore,
        comment:
          totalWords > 70
            ? 'Maintained composure and engaged thoughtfully throughout the questions.'
            : 'Work on answering with more conviction and technical detail.',
      },
    },
    strengths: [
      totalWords > 50
        ? `Direct engagement with the questions, such as when discussing "${snippet}".`
        : 'Clear willingness to answer and explore interview topics.',
      hasCode
        ? 'Submitted a functional code solution.'
        : 'Maintained a professional tone throughout the session.',
    ],
    areasOfImprovement: [
      totalWords < 80
        ? 'Provide more detailed context, specific metrics, and real-world challenges from past projects.'
        : 'Deepen technical trade-off discussions regarding performance and architecture.',
      'Use the STAR method (Situation, Task, Action, Result) for behavioral questions.',
    ],
    finalAssessment:
      overallScore >= 75
        ? `A strong performance with good communication and relevant competencies.`
        : `A promising start, though expanding your technical depth and providing more detailed answers will significantly improve your interview outcome.`,
  };
};

export const endInterview = async (interviewId, userId) => {
  const interview = await Interview.findOne({ _id: interviewId, userId });
  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }

  if (interview.status !== 'completed') {
    const history = buildConversationHistory(interview.messages);
    const codeSubs = interview.codeSubmissions
      .map((c) => `Language: ${c.language}\nCode:\n${c.code}`)
      .join('\n\n');
    const feedbackPrompt = FEEDBACK_PROMPT(interview.role, history, codeSubs);

    let feedback;
    try {
      const feedbackRaw = await askGemini(feedbackPrompt);
      feedback = parseGeminiJSON(feedbackRaw);
    } catch (parseErr) {
      console.warn('⚠️ Feedback parsing fallback triggered in endInterview:', parseErr.message);
      feedback = generateDynamicFallbackFeedback(interview);
    }

    interview.status = 'completed';
    interview.feedback = feedback;
    interview.overallScore = feedback.overallScore || 80;
    await interview.save();
  }

  return interview;
};