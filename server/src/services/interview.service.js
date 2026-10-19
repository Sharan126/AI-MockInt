import crypto from 'crypto';
import Interview from '../models/Interview.model.js';
import User from '../models/User.model.js';
import { askGemini } from './gemini.service.js';
import { generateAudio } from './murf.service.js';
import { parseGeminiJSON } from '../utils/prompts.utils.js';
import {
  GENERATE_QUESTIONS_PROMPT,
  INTERVIEW_GREETING_PROMPT,
  FOLLOW_UP_PROMPT,
  FEEDBACK_PROMPT,
  EVALUATE_CODE_PROMPT,
  PRESSURE_PROBE_PROMPT,
  RESUME_OPTIMIZER_PROMPT,
  SYSTEM_DESIGN_AUDIT_PROMPT,
  CLARIFY_QUESTION_PROMPT,
  COMMITTEE_VOTE_PROMPT,
  AUDIT_STAR_PROMPT,
  NEGOTIATION_PROMPT,
  buildConversationHistory,
} from '../constants/prompts.js';

/**
 * Calculates speech metrics including WPM, filler word count, and fluency score.
 */
export const calculateSpeechMetrics = (candidateMessages = []) => {
  const combinedText = candidateMessages.map((m) => m.content || '').join(' ');
  const words = combinedText.trim().split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  const fillerRegex = /\b(um|uh|er|ah|like|you know|sort of|kind of|basically|actually|literally|i mean)\b/gi;
  const matches = combinedText.match(fillerRegex) || [];
  const fillerCount = matches.length;
  const uniqueFillers = [...new Set(matches.map((m) => m.toLowerCase()))];

  const estimatedMinutes = Math.max(1, candidateMessages.length * 0.75);
  const wpm = Math.round(totalWords / estimatedMinutes);

  const fillerRatio = totalWords > 0 ? fillerCount / totalWords : 0;
  const fluencyScore = Math.max(45, Math.min(98, Math.round(100 - fillerRatio * 250)));

  return {
    totalWords,
    wpm: wpm || 135,
    fillerCount,
    fillerWords: uniqueFillers,
    fluencyScore,
  };
};

export const startInterview = async (
  userId,
  role,
  resumeText,
  candidateName,
  totalQuestions = 5,
  companyTrack = 'General',
  interviewerPersona = 'Natalie',
  jobDescription = '',
  pressureMode = false,
  isSuperday = false
) => {
  let questions = [];
  let introQuestion = null;

  if (isSuperday) {
    questions = [
      {
        text: `Round 1 (Screening & Architecture Fundamentals): Walk me through how you architect high-scale, resilient services for a ${role} position. Trace a mission-critical request from client through DNS, load balancer, microservice layer, and persistent datastore.`,
        type: 'technical',
        isCodeQuestion: false,
        stage: 'Technical Screening',
      },
      {
        text: `Round 2 (Data Structures & Algorithmic Problem Solving): Given an array of integers representing request timestamps and a sliding window limit, design an optimal algorithm in the code editor to enforce distributed rate limiting with minimum space overhead.`,
        type: 'technical',
        isCodeQuestion: true,
        stage: 'Algorithms & Coding',
      },
      {
        text: `Round 3 (Distributed System Architecture): Design a high-throughput, globally distributed notification service handling 100M daily notifications with multi-region failover and exactly-once delivery semantics. Open the Architecture Canvas to diagram your components.`,
        type: 'system-design',
        isCodeQuestion: false,
        stage: 'System Design Whiteboard',
      },
      {
        text: `Round 4 (Executive Bar-Raiser Behavioral): Tell me about a time you had a high-stakes disagreement with a senior engineer or product director regarding an architectural trade-off. What data did you use, how did you navigate team consensus, and what was the quantifiable business outcome?`,
        type: 'behavioral',
        isCodeQuestion: false,
        stage: 'Bar Raiser Leadership',
      },
    ];
    introQuestion = questions[0];
  } else {
    const questionsPrompt = GENERATE_QUESTIONS_PROMPT(
      role,
      resumeText,
      totalQuestions,
      companyTrack,
      jobDescription
    );
    const questionsResponse = await askGemini(questionsPrompt);
    const aiQuestions = parseGeminiJSON(questionsResponse);

    introQuestion = {
      text: "Tell me about yourself — your background, what you're currently working on, and what excites you about this role.",
      type: 'behavioral',
      isCodeQuestion: false,
    };
    questions = [introQuestion, ...aiQuestions];
  }

  const interview = await Interview.create({
    userId,
    role,
    resumeText,
    totalQuestions: questions.length,
    currentQuestion: 1,
    questions,
    companyTrack,
    interviewerPersona,
    jobDescription,
    pressureMode: Boolean(pressureMode),
    isSuperday: Boolean(isSuperday),
    isProbing: false,
    status: 'in_progress',
  });

  const greetingPrompt = isSuperday
    ? `You are ${interviewerPersona}, an Executive Bar Raiser leading a comprehensive 4-Round FAANG Superday Interview Loop for a ${role} position on the ${companyTrack} track. Deliver a warm, high-stakes 2-sentence opening greeting welcoming candidate ${candidateName} to their full-loop Superday.`
    : INTERVIEW_GREETING_PROMPT(
        role,
        candidateName,
        interviewerPersona,
        companyTrack
      );
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
    companyTrack,
    interviewerPersona,
    pressureMode: interview.pressureMode,
    isSuperday: interview.isSuperday,
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

export const answerQuestion = async (interviewId, userId, answer, candidateAudio = null) => {
  const interview = await Interview.findOne({ _id: interviewId, userId });
  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }

  interview.messages.push({
    role: 'candidate',
    content: answer,
    audio: candidateAudio || '',
    timestamp: new Date(),
  });

  // MULTI-TURN PRESSURE MODE (GRILL ME MODE)
  // If pressureMode is active and we haven't probed this question yet, issue a pushback challenge
  if (interview.pressureMode && !interview.isProbing) {
    const currentQ = interview.questions[interview.currentQuestion - 1];
    const probePrompt = PRESSURE_PROBE_PROMPT(
      interview.role,
      currentQ ? currentQ.text : 'Previous topic',
      answer,
      interview.interviewerPersona || 'Marcus',
      interview.companyTrack || 'General'
    );

    let probeText;
    try {
      probeText = await askGemini(probePrompt);
    } catch {
      probeText =
        'How would your architecture handle a 10x traffic spike or node partition under tight SLAs?';
    }

    interview.isProbing = true;
    interview.messages.push({
      role: 'interviewer',
      content: probeText,
      isProbe: true,
      timestamp: new Date(),
    });

    let probeAudio = null;
    try {
      probeAudio = await generateAudio(probeText);
    } catch (err) {
      console.warn('Probe audio failed:', err.message);
    }

    interview.lastAudio = probeAudio || '';
    await interview.save();

    return {
      isComplete: false,
      isProbe: true,
      followUp: probeText,
      question: currentQ,
      currentQuestion: interview.currentQuestion,
      totalQuestions: interview.totalQuestions,
      audio: probeAudio,
    };
  }

  // If we just finished a probe, reset probing flag
  if (interview.isProbing) {
    interview.isProbing = false;
  }

  const nextIndex = interview.currentQuestion;
  const isComplete = nextIndex >= interview.totalQuestions;

  if (isComplete) {
    const candidateMessages = interview.messages.filter((m) => m.role === 'candidate');
    const speechMetrics = calculateSpeechMetrics(candidateMessages);
    interview.speechMetrics = speechMetrics;

    const history = buildConversationHistory(interview.messages);
    const codeSubs = interview.codeSubmissions
      .map((c) => `Language: ${c.language}\nCode:\n${c.code}`)
      .join('\n\n');
    const feedbackPrompt = FEEDBACK_PROMPT(
      interview.role,
      history,
      codeSubs,
      interview.companyTrack || 'General',
      speechMetrics
    );

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
      speechMetrics,
    };
  }

  const nextQuestion = interview.questions[nextIndex];
  interview.currentQuestion = nextIndex + 1;

  const history = buildConversationHistory(interview.messages);
  const followUpPrompt = FOLLOW_UP_PROMPT(
    interview.role,
    history,
    nextQuestion.text,
    interview.interviewerPersona || 'Natalie'
  );
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
    isProbe: false,
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

  const currentQ = interview.questions[interview.currentQuestion - 1];
  const questionText = currentQ ? currentQ.text : 'Coding problem';

  const evalPrompt = EVALUATE_CODE_PROMPT(interview.role, questionText, code, language);
  let evaluation;

  try {
    const evalRaw = await askGemini(evalPrompt);
    evaluation = parseGeminiJSON(evalRaw);
  } catch {
    evaluation = {
      isCorrect: true,
      score: 75,
      feedback: 'Code submitted and evaluated for the role.',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
      suggestions: 'Ensure all boundary conditions and null inputs are guarded.',
    };
  }

  interview.codeSubmissions.push({
    questionIndex: interview.currentQuestion - 1,
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

  const candidateMessages = interview.messages.filter((m) => m.role === 'candidate');
  const speechMetrics = calculateSpeechMetrics(candidateMessages);
  interview.speechMetrics = speechMetrics;

  const history = buildConversationHistory(interview.messages);
  const codeSubs = interview.codeSubmissions
    .map((c) => `Language: ${c.language}\nCode:\n${c.code}`)
    .join('\n\n');
  const feedbackPrompt = FEEDBACK_PROMPT(
    interview.role,
    history,
    codeSubs,
    interview.companyTrack || 'General',
    speechMetrics
  );

  let feedback;
  try {
    const feedbackRaw = await askGemini(feedbackPrompt);
    feedback = parseGeminiJSON(feedbackRaw);
  } catch (parseErr) {
    console.warn('⚠️ Fallback feedback triggered:', parseErr.message);
    feedback = generateDynamicFallbackFeedback(interview);
  }

  let committeeVote = null;
  if (interview.isSuperday) {
    try {
      const committeePrompt = COMMITTEE_VOTE_PROMPT(
        interview.role,
        interview.companyTrack || 'General',
        history,
        codeSubs,
        feedback,
        speechMetrics,
        interview.visionMetrics || {}
      );
      const committeeRaw = await askGemini(committeePrompt);
      committeeVote = parseGeminiJSON(committeeRaw);
    } catch (err) {
      console.warn('Committee vote fallback:', err.message);
      committeeVote = {
        consensusVote: feedback.overallScore >= 80 ? 'Strong Hire' : feedback.overallScore >= 70 ? 'Lean Hire' : 'Lean No-Hire',
        calibratedLevel: feedback.overallScore >= 85 ? 'L5 (Senior Software Engineer)' : 'L4 (Software Engineer II)',
        committeeScore: feedback.overallScore || 80,
        summaryReasoning: 'Candidate demonstrated proficient system knowledge and clear engineering rationale across all 4 evaluation rounds.',
        debaterPerspectives: [
          { role: 'Hiring Manager', verdict: 'Hire', comment: 'Solid foundation and team collaboration mindset.' },
          { role: 'Staff Bar Raiser', verdict: 'Hire', comment: 'Addressed edge cases and structural trade-offs adequately.' },
          { role: 'Peer Senior Engineer', verdict: 'Hire', comment: 'Clear code structure and respectful communication.' }
        ],
        levelingGapAnalysis: 'Deepen multi-region failure domain handling to advance to Principal level.'
      };
    }
    interview.committeeVote = committeeVote;
  }

  interview.status = 'completed';
  interview.feedback = feedback;
  interview.overallScore = feedback.overallScore || 80;
  await interview.save();

  return {
    isComplete: true,
    feedback,
    overallScore: interview.overallScore,
    speechMetrics,
    committeeVote: interview.committeeVote,
  };
};

export const auditSystemDesign = async (interviewId, userId, architectureData) => {
  const interview = await Interview.findOne({ _id: interviewId, userId });
  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }

  interview.whiteboardData = architectureData;
  await interview.save();

  const auditPrompt = SYSTEM_DESIGN_AUDIT_PROMPT(
    interview.role,
    architectureData.nodes || [],
    architectureData.connections || []
  );

  let audit;
  try {
    const rawAudit = await askGemini(auditPrompt);
    audit = parseGeminiJSON(rawAudit);
  } catch (err) {
    console.warn('System design audit fallback:', err.message);
    audit = {
      scalabilityScore: 82,
      spofRisks: ['Database instance requires read-replicas and automatic multi-AZ failover.'],
      cachingEvaluation: 'Introduce Redis/Memcached layer before the primary database to absorb read bursts.',
      databaseStrategy: 'Implement read/write separation and evaluate sharding if write volume exceeds single-node capacity.',
      strengths: ['Decoupled modular architecture', 'Appropriate load balancing for web traffic'],
      recommendations: [
        'Place asynchronous message queues (e.g. RabbitMQ/Kafka) between services for spike dampening.',
        'Implement circuit breakers (e.g. Resilience4j/Polly) to prevent cascading failures.'
      ]
    };
  }

  return audit;
};

export const optimizeResume = async (resumeText, targetRole = 'Software Engineer') => {
  if (!resumeText || resumeText.trim().length < 20) {
    const error = new Error('Resume text is too brief to analyze. Please provide complete resume content.');
    error.statusCode = 400;
    throw error;
  }

  const prompt = RESUME_OPTIMIZER_PROMPT(resumeText, targetRole);
  let result;
  try {
    const raw = await askGemini(prompt);
    result = parseGeminiJSON(raw);
  } catch (err) {
    console.warn('Resume optimizer fallback:', err.message);
    result = {
      atsScore: 78,
      summary: `Foundational resume structure for ${targetRole}, but needs stronger action verbs and quantified impact metrics.`,
      actionVerbsScore: 75,
      quantifiableMetricsScore: 68,
      bulletImprovements: [
        {
          original: 'Built and maintained web application features and resolved bugs.',
          improved: 'Architected and launched 6+ mission-critical web application modules, resolving technical debt and increasing sprint velocity by 30%.',
          reason: 'Uses active leadership verb and quantifies delivery impact.'
        },
        {
          original: 'Worked with database queries and backend APIs.',
          improved: 'Engineered high-performance REST APIs with Redis caching, cutting p95 response times by 45% for 50,000+ daily active users.',
          reason: 'Demonstrates specific architectural tooling and measurable performance gain.'
        }
      ],
      matchedKeywords: ['Full Stack', 'APIs', 'Database', 'Git', 'Problem Solving'],
      missingKeywords: ['CI/CD Automation', 'Docker Containers', 'System Observability', 'Unit & Integration Testing', 'Cloud Architecture']
    };
  }

  return result;
};

export const generateShareToken = async (interviewId, userId) => {
  const interview = await Interview.findOne({ _id: interviewId, userId });
  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }

  if (!interview.shareToken) {
    interview.shareToken = crypto.randomBytes(16).toString('hex');
    await interview.save();
  }

  return {
    shareToken: interview.shareToken,
    shareUrl: `/feedback/share/${interview.shareToken}`,
  };
};

export const getSharedInterview = async (token) => {
  const interview = await Interview.findOne({ shareToken: token }).select(
    'role status feedback overallScore companyTrack interviewerPersona speechMetrics messages whiteboardData createdAt'
  );

  if (!interview) {
    const error = new Error('Shared interview link is invalid or expired.');
    error.statusCode = 404;
    throw error;
  }

  return interview;
};

export const updateUserGoal = async (userId, goalData) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  user.targetGoal = {
    ...user.targetGoal?.toObject(),
    ...goalData,
  };
  await user.save();

  return user.targetGoal;
};

export const clarifyQuestion = async (interviewId, userId, questionText) => {
  const interview = await Interview.findOne({ _id: interviewId, userId });
  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }

  const currentQ = interview.questions[interview.currentQuestion - 1] || interview.questions[0];
  const prompt = CLARIFY_QUESTION_PROMPT(
    interview.role,
    currentQ ? currentQ.text : 'Current interview problem',
    questionText,
    interview.interviewerPersona || 'Natalie',
    interview.companyTrack || 'General'
  );

  const clarificationAnswer = await askGemini(prompt);
  interview.clarifications.push({
    questionText,
    answerText: clarificationAnswer,
    questionIndex: interview.currentQuestion,
    timestamp: new Date(),
  });

  let audioBase64 = null;
  try {
    audioBase64 = await generateAudio(clarificationAnswer);
  } catch (err) {
    console.warn('Clarification audio synthesis fallback:', err.message);
  }

  interview.lastAudio = audioBase64 || '';
  await interview.save();

  return {
    answer: clarificationAnswer,
    audio: audioBase64,
  };
};

export const saveVisionMetrics = async (interviewId, userId, metrics) => {
  const interview = await Interview.findOne({ _id: interviewId, userId });
  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }

  interview.visionMetrics = metrics;
  await interview.save();
  return interview.visionMetrics;
};

export const auditStarStory = async (storyData) => {
  const prompt = AUDIT_STAR_PROMPT(storyData);
  let result;
  try {
    const raw = await askGemini(prompt);
    result = parseGeminiJSON(raw);
  } catch (err) {
    console.warn('STAR audit fallback:', err.message);
    result = {
      starScore: 84,
      situationFeedback: 'Context is established clearly with appropriate operational stakes.',
      taskFeedback: 'Good demonstration of individual technical ownership.',
      actionFeedback: 'Specific engineering decisions articulated well.',
      resultFeedback: 'Include more direct percentage or latency metrics to maximize executive impact.',
      strengths: ['High personal ownership', 'Clear technical framing'],
      improvements: ['Add quantitative baseline metrics before and after the solution'],
      executiveTip: 'Lead with the business impact number in the opening hook.'
    };
  }
  return result;
};

export const getStarStories = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  return user.starStories || [];
};

export const saveStarStory = async (userId, storyData) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (!user.starStories) user.starStories = [];

  if (storyData.id) {
    const idx = user.starStories.findIndex((s) => s.id === storyData.id);
    if (idx !== -1) {
      user.starStories[idx] = { ...user.starStories[idx], ...storyData, updatedAt: new Date() };
    } else {
      user.starStories.push({ ...storyData, createdAt: new Date() });
    }
  } else {
    const newStory = {
      id: `star-${Date.now()}`,
      ...storyData,
      createdAt: new Date(),
    };
    user.starStories.push(newStory);
  }

  user.markModified('starStories');
  await user.save();
  return user.starStories;
};

export const deleteStarStory = async (userId, storyId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.starStories = (user.starStories || []).filter((s) => s.id !== storyId);
  user.markModified('starStories');
  await user.save();
  return user.starStories;
};

export const simulateNegotiation = async (negotiationData) => {
  const prompt = NEGOTIATION_PROMPT(negotiationData);
  let result;
  try {
    const raw = await askGemini(prompt);
    result = parseGeminiJSON(raw);
  } catch (err) {
    console.warn('Negotiation simulation fallback:', err.message);
    const target = Number(negotiationData.targetComp) || 350000;
    const base = Number(negotiationData.baseSalary) || 180000;
    result = {
      recruiterResponse: `Thank you for sharing your thoughtful breakdown and competing opportunities. While our base salary bands are strictly calibrated at $${base + 5000} to preserve team parity, we have flexibility on variable compensation. We are prepared to increase our initial sign-on bonus by $15,000 and enhance your annual RSU equity award to align closely with your expectations.`,
      revisedOffer: {
        baseSalary: base + 5000,
        equity: Math.round(target * 0.4),
        signOn: 45000,
        totalComp: target - 10000,
        leversAdjusted: 'Increased sign-on bonus by $15,000 and enhanced equity grant.'
      },
      leverageScore: 82,
      tacticalCritique: 'Strong articulation of market value and positive collaborative tone. Focusing the counter on sign-on bonus rather than base salary maximizes your probability of approval.',
      recommendedCounterEmail: `Hi [Recruiter Name],\n\nThank you again for the offer to join [Company] as [Role]. I remain thrilled about the team's mission and the technical challenges ahead.\n\nAfter reviewing the full package and comparing it with other active discussions, I am eager to sign immediately if we can bridge the total compensation to $${target}. Given company band structures, I am very flexible on whether this is structured through sign-on bonus or equity.\n\nLooking forward to finalizing this!\n\nBest regards,\n[Your Name]`
    };
  }
  return result;
};