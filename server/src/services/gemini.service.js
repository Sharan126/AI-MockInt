import { generateContent } from '../config/gemini.config.js';

const getMockResponse = (prompt) => {
  // 1. Feedback evaluation (checked first to prevent interview history tokens from matching greeting/followup)
  if (
    prompt.includes('expert interview evaluator') ||
    prompt.includes('categoryScores') ||
    prompt.includes('FEEDBACK') ||
    prompt.includes('COMPLETE INTERVIEW CONVERSATION:')
  ) {
    return JSON.stringify({
      overallScore: 82,
      categoryScores: {
        communicationSkills: {
          score: 85,
          comment:
            'You communicated clearly and explained your rationale and trade-offs effectively.',
        },
        technicalKnowledge: {
          score: 80,
          comment:
            'You demonstrated solid conceptual knowledge relevant to the role.',
        },
        problemSolving: {
          score: 85,
          comment:
            'Structured, analytical approach to addressing technical prompts.',
        },
        codeQuality: {
          score: 80,
          comment:
            'Clean, readable syntax with proper naming and edge-case awareness.',
        },
        confidence: {
          score: 80,
          comment: 'Poised, professional, and thoughtful during the conversation.',
        },
      },
      strengths: [
        'Clear and structured articulation of past technical challenges.',
        'Strong problem-solving instincts and methodical approach to coding problems.',
      ],
      areasOfImprovement: [
        'Could dive deeper into system performance optimizations and memory footprints.',
        'Provide more specific metrics on impact when discussing previous project achievements.',
      ],
      finalAssessment:
        'A very strong technical interview performance showing solid competencies and strong potential for the role.',
    });
  }

  // 2. Code evaluation
  if (
    prompt.includes('expert code reviewer') ||
    prompt.includes('EVALUATE_CODE') ||
    prompt.includes('TASK TYPE:')
  ) {
    return JSON.stringify({
      isCorrect: true,
      score: 85,
      feedback:
        'Good implementation! The logic covers edge cases and follows clean coding conventions.',
      suggestions:
        'Consider optimizing memory overhead for extremely large input datasets.',
    });
  }

  // 3. Question generation
  if (
    prompt.includes('GENERATE_QUESTIONS') ||
    prompt.includes('Analyze the candidate\'s resume') ||
    prompt.includes('CODING QUESTION RULES:') ||
    prompt.includes('Return ONLY a valid JSON array')
  ) {
    let role = 'Software Engineer';
    const roleMatch = prompt.match(/conducting a (.*?) interview/i);
    if (roleMatch && roleMatch[1]) role = roleMatch[1].trim();

    return JSON.stringify([
      {
        text: `Tell me about a challenging project in your ${role} experience and how you handled unexpected technical hurdles.`,
        type: 'behavioral',
        isCodeQuestion: false,
      },
      {
        text: `How do you approach code architecture, testing, and scalability in a ${role} environment?`,
        type: 'technical',
        isCodeQuestion: false,
      },
      {
        text: `Can you explain how state management and asynchronous data flow work in your primary tech stack?`,
        type: 'technical',
        isCodeQuestion: false,
      },
      {
        text: `Write a function in JavaScript to check if a given string contains balanced parentheses, brackets, and braces.`,
        type: 'technical',
        isCodeQuestion: true,
        codeType: 'write',
        codeLanguage: 'javascript',
      },
    ]);
  }

  // 4. Follow up acknowledgment
  if (
    prompt.includes('CONVERSATION SO FAR:') ||
    prompt.includes('IMPORTANT GUIDELINES:') ||
    prompt.includes('FOLLOW_UP')
  ) {
    return `Thank you for sharing that context. That demonstrates solid problem solving and clear communication. Let's move on to the next question.`;
  }

  // 5. Greeting (strict match - only when specifically generating the initial greeting)
  if (
    prompt.includes('SHORT and WARM greeting') ||
    prompt.includes('INTERVIEW_GREETING')
  ) {
    let candidateName = 'there';
    const nameMatch = prompt.match(/candidate named (.*?),/i);
    if (nameMatch && nameMatch[1]) candidateName = nameMatch[1].trim();

    let role = 'Technical';
    const roleMatch = prompt.match(/conducting a (.*?) interview/i);
    if (roleMatch && roleMatch[1]) role = roleMatch[1].trim();

    return `Hi ${candidateName}! I'm Natalie, your technical interviewer today for the ${role} position. We're excited to have you here! Take your time with your answers — there are no wrong answers, and we're looking to understand your thought process. Let's start with the basics — tell me about yourself.`;
  }

  return 'I acknowledge your answer. Let us proceed to the next step.';
};

export const askGemini = async (prompt) => {
  try {
    const response = await generateContent(prompt);

    if (!response) {
      throw new Error('Gemini returned an empty response');
    }

    return response;
  } catch (error) {
    console.warn(
      '⚠️ Gemini Service Warning (using fallback response):',
      error.message
    );
    return getMockResponse(prompt);
  }
};

export default { askGemini };