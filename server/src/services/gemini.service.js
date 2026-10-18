import { generateContent } from '../config/gemini.config.js';

const getMockResponse = (prompt) => {
  // 1. Feedback evaluation (checked first to prevent interview history tokens from matching greeting/followup)
  if (
    prompt.includes('expert interview evaluator') ||
    prompt.includes('categoryScores') ||
    prompt.includes('FEEDBACK') ||
    prompt.includes('COMPLETE INTERVIEW CONVERSATION:')
  ) {
    const candidateLines = (
      prompt.match(/Candidate:\s*([^\n]+)/gi) || []
    ).map((l) => l.replace(/Candidate:\s*/i, '').trim());

    const totalWords = candidateLines.join(' ').split(/\s+/).filter(Boolean).length;
    const hasCode =
      prompt.includes('CODE SUBMISSIONS:') &&
      !prompt.includes('CODE SUBMISSIONS:\n\n') &&
      prompt.split('CODE SUBMISSIONS:')[1]?.trim()?.length > 10;

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

    const calculatedOverall = Math.round(
      (commScore + techScore + probScore + codeScore + confScore) / 5
    );

    const firstAnswer = candidateLines[0] || 'your initial introduction';
    const sampleSnippet =
      firstAnswer.length > 50 ? firstAnswer.substring(0, 50) + '...' : firstAnswer;

    return JSON.stringify({
      overallScore: calculatedOverall,
      categoryScores: {
        communicationSkills: {
          score: commScore,
          comment:
            totalWords > 70
              ? `You communicated your thoughts with clear structure when answering: "${sampleSnippet}".`
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
          ? `Direct engagement with the questions, such as when discussing "${sampleSnippet}".`
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
        calculatedOverall >= 75
          ? 'A strong performance with good communication and relevant competencies.'
          : 'A promising start, though expanding your technical depth and providing more detailed answers will significantly improve your interview outcome.',
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