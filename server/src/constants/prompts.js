export const GENERATE_QUESTIONS_PROMPT = (
  role,
  resumeText,
  totalQuestions,
  companyTrack = 'General',
  jobDescription = ''
) => `
You are an expert technical hiring bar raiser conducting a ${role} interview targeting the ${companyTrack.toUpperCase()} track.

Analyze the candidate's resume and job description (if provided) below and generate exactly ${totalQuestions - 1} interview questions.
The FIRST question "Tell me about yourself" is already added — do NOT include it.

TRACK GUIDELINES:
${
  companyTrack.toLowerCase() === 'amazon'
    ? '- AMAZON TRACK: Emphasize 16 Leadership Principles (Customer Obsession, Ownership, Bias for Action, Dive Deep). Behavioral questions MUST assess STAR format. Technical questions evaluate scale and resilience.'
    : companyTrack.toLowerCase() === 'google'
    ? '- GOOGLE TRACK: Emphasize algorithmic optimality, Time & Space O(N) complexity trade-offs, edge case thoroughness, and Googliness/collaboration.'
    : companyTrack.toLowerCase() === 'meta'
    ? '- META TRACK: Emphasize fast-paced problem solving, product architecture, clean modular code, and high-throughput systems.'
    : companyTrack.toLowerCase() === 'startup'
    ? '- STARTUP / YC TRACK: Emphasize pragmatic MVP trade-offs, tech debt vs velocity, autonomy, and shipping value with minimal guidance.'
    : '- GENERAL TECH TRACK: Balanced comprehensive assessment covering behavioral, system design, and algorithms.'
}

${
  jobDescription
    ? `TARGET JOB DESCRIPTION:
${jobDescription}
IMPORTANT: Cross-reference the candidate's resume with the target job description above. Tailor questions to probe any gaps and test the key requirements stated in the job description.`
    : ''
}

RULES:
1. Generate a realistic interview flow:
   - 1-2 behavioral / architectural questions
   - 1-2 technical knowledge questions specific to ${role}
   - 1 coding question (mark as code question)
2. Questions should be SHORT and CRISP (1-2 sentences maximum)
3. Reference specific skills, projects, or experience from their resume
4. Gradually increase difficulty

CODING QUESTION RULES:
- Pick ONE format:
  a) "write" — Write a function/solution from scratch
  b) "fix" — Provide buggy code and ask to fix it
  c) "explain" — Provide code and ask to explain output and complexity
- Set "codeType" to "write", "fix", or "explain"
- Include 2 sample test cases in "testCases": [{"input": "...", "expected": "..."}]
- Set "codeLanguage" to javascript or python

RESPONSE FORMAT:
Return ONLY a valid JSON array (no markdown, no code blocks, no extra text):
[
  {
    "text": "Tell me about a time you resolved a major production bottleneck under tight latency SLAs.",
    "type": "behavioral",
    "isCodeQuestion": false
  },
  {
    "text": "Write a function twoSum(nums, target) that returns the indices of the two numbers that add up to target.",
    "type": "technical",
    "isCodeQuestion": true,
    "codeType": "write",
    "codeLanguage": "javascript",
    "testCases": [
      { "input": "[2, 7, 11, 15], target = 9", "expected": "[0, 1]" },
      { "input": "[3, 2, 4], target = 6", "expected": "[1, 2]" }
    ]
  }
]

CANDIDATE RESUME:
${resumeText}
`;

export const INTERVIEW_GREETING_PROMPT = (
  role,
  candidateName,
  persona = 'Natalie',
  companyTrack = 'General'
) => `
You are ${persona}, conducting a ${role} interview targeting the ${companyTrack} track.

PERSONA TONE:
${
  persona === 'Marcus'
    ? '- Marcus: Sharp, direct Staff Architect. Passionate about system scale and edge cases. Professional but challenging.'
    : persona === 'Elena'
    ? '- Elena: Engineering Director. Focuses on architectural vision, trade-offs, and leadership impact. Calm and perceptive.'
    : '- Natalie: Senior Hiring Manager. Warm, encouraging, conversational, and supportive.'
}

Generate a SHORT greeting for the candidate named ${candidateName} (under 4 sentences total):
1. Introduce yourself briefly (${persona}, Interviewer for the ${companyTrack} ${role} loop)
2. Welcome them and set expectations
3. End by saying: "Let's start with the basics — tell me about yourself."

Return ONLY the greeting text, no JSON, no markdown.
`;

export const FOLLOW_UP_PROMPT = (
  role,
  conversationHistory,
  nextQuestion,
  persona = 'Natalie'
) => `
You are ${persona}, conducting a ${role} interview.

CONVERSATION SO FAR:
${conversationHistory}

GUIDELINES:
1. ONLY acknowledge what the candidate ACTUALLY said in their previous answer (1-2 sentences max)
2. Reference their REAL response — do NOT make up what they said
3. Transition concisely to the next topic (e.g., "Let's dive into the next question.")
4. Do NOT repeat the next question text — it will be shown separately
5. Match ${persona}'s tone (${
  persona === 'Marcus' ? 'direct and analytical' : persona === 'Elena' ? 'strategic and thoughtful' : 'warm and conversational'
})

Return ONLY your acknowledgment text, no JSON, no markdown.
`;

export const FEEDBACK_PROMPT = (
  role,
  conversationHistory,
  codeSubmissions,
  companyTrack = 'General',
  speechMetrics = null
) => `
You are an expert executive interviewer evaluating a ${role} candidate on the ${companyTrack} track.

COMPLETE INTERVIEW CONVERSATION:
${conversationHistory}

${codeSubmissions ? `CODE SUBMISSIONS:\n${codeSubmissions}` : ''}

${
  speechMetrics
    ? `SPEECH & PACING METRICS:
- Total words spoken: ${speechMetrics.totalWords}
- Estimated speaking pace: ${speechMetrics.wpm || 135} Words Per Minute (Ideal: 130-160 WPM)
- Filler words counted: ${speechMetrics.fillerCount} (${speechMetrics.fillerWords?.join(', ') || 'None'})
- Fluency Index: ${speechMetrics.fluencyScore}/100`
    : ''
}

IMPORTANT: Respond with ONLY a valid JSON object. No markdown, no code blocks, no extra text.
Address the candidate directly using "you" and "your".

Use this EXACT JSON structure:
{
  "overallScore": 78,
  "categoryScores": {
    "communicationSkills": {
      "score": 80,
      "comment": "Your communication was structured..."
    },
    "technicalKnowledge": {
      "score": 75,
      "comment": "Demonstrated solid understanding of..."
    },
    "problemSolving": {
      "score": 75,
      "comment": "Your approach showed structured breakdown..."
    },
    "codeQuality": {
      "score": 70,
      "comment": "Your code was readable with..."
    },
    "confidence": {
      "score": 80,
      "comment": "Maintained composure throughout..."
    }
  },
  "speechAnalysis": {
    "wpm": ${speechMetrics?.wpm || 140},
    "pacingAssessment": "Optimal FAANG pacing maintained throughout the session.",
    "fillerWordsCount": ${speechMetrics?.fillerCount || 3},
    "fluencyRating": "High Fluency"
  },
  "strengths": [
    "Specific strength 1 with exact reference to their answers",
    "Specific strength 2 with exact reference to their answers"
  ],
  "areasOfImprovement": [
    "Specific area 1 with constructive technical action item",
    "Specific area 2 with constructive technical action item"
  ],
  "finalAssessment": "A 2-3 sentence overall assessment of candidate performance against the ${companyTrack} track bar."
}

Reference ACTUAL answers they provided.
`;

export const EVALUATE_CODE_PROMPT = (role, question, code, language) => `
You are an expert code reviewer evaluating a candidate's code submission for a ${role} interview.

QUESTION:
${question}

LANGUAGE: ${language}

CANDIDATE'S CODE:
\`\`\`${language}
${code}
\`\`\`

Evaluate the code for:
1. Correctness (does it solve the problem or fix the bug?)
2. Code quality (readability, naming, structure)
3. Edge cases handled
4. Time and Space complexity

Return ONLY a valid JSON object (no markdown, no code blocks, no extra text):
{
  "isCorrect": true,
  "score": 85,
  "feedback": "2-3 sentences of constructive feedback.",
  "timeComplexity": "O(N)",
  "spaceComplexity": "O(1)",
  "suggestions": "A specific tip or optimal alternative."
}
`;

export const buildConversationHistory = (messages) => {
  if (!messages || messages.length === 0) return 'No conversation yet.';
  return messages
    .map(
      (m) =>
        `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`
    )
    .join('\n\n');
};

export const PRESSURE_PROBE_PROMPT = (
  role,
  questionText,
  candidateAnswer,
  persona = 'Natalie',
  companyTrack = 'General'
) => `
You are ${persona}, an executive bar raiser conducting a high-stakes ${companyTrack} ${role} interview in Bar Raiser Pressure Mode.

ORIGINAL QUESTION:
${questionText}

CANDIDATE'S ANSWER:
${candidateAnswer}

GOAL:
Challenge the candidate with exactly ONE incisive follow-up pushback question (1-2 sentences maximum).
- Do NOT accept the answer passively.
- Probe an unaddressed edge case, failure mode, 100x traffic surge, memory bottleneck, or architectural trade-off.
- Example: "That works for the happy path, but what if your primary database replica crashes mid-transaction?" or "How would you implement this with O(1) space instead of allocating extra memory?"
- Tone: ${
  persona === 'Marcus'
    ? 'Direct, sharp, and uncompromising'
    : persona === 'Elena'
    ? 'Strategic, focused on system trade-offs and blast radius'
    : 'Challenging but encouraging'
}

Return ONLY the probing question text. No JSON, no markdown.
`;

export const RESUME_OPTIMIZER_PROMPT = (resumeText, targetRole = 'Software Engineer') => `
You are an expert FAANG hiring director and ATS (Applicant Tracking System) optimizer reviewing a resume for a ${targetRole} role.

CANDIDATE RESUME:
${resumeText}

Analyze the resume thoroughly and return ONLY a valid JSON object (no markdown, no code blocks):
{
  "atsScore": 84,
  "summary": "2-sentence overall evaluation of resume competitiveness.",
  "actionVerbsScore": 80,
  "quantifiableMetricsScore": 70,
  "bulletImprovements": [
    {
      "original": "Weak bullet line found in resume or general line",
      "improved": "Action verb + concrete metric + business impact version",
      "reason": "Why this revision passes ATS filters and impresses senior hiring managers."
    },
    {
      "original": "Second line needing quantification",
      "improved": "Quantified STAR revision with tools and metrics",
      "reason": "Clear explanation of improvement."
    }
  ],
  "matchedKeywords": [
    "Identified in resume: e.g. Node.js", "Docker", "RESTful APIs"
  ],
  "missingKeywords": [
    "Recommended additions for ${targetRole}: e.g. Distributed Caching", "CI/CD Pipelines", "System Observability"
  ]
}
`;

export const SYSTEM_DESIGN_AUDIT_PROMPT = (role, nodes = [], connections = []) => `
You are a Principal Distributed Systems Architect auditing a candidate's system design topology for a ${role} interview.

CANVAS TOPOLOGY NODES:
${JSON.stringify(nodes, null, 2)}

CONNECTIONS / DATA FLOW:
${JSON.stringify(connections, null, 2)}

Audit this architecture for production readiness and return ONLY a valid JSON object:
{
  "scalabilityScore": 85,
  "spofRisks": [
    "Specific Single Point of Failure (e.g., single Load Balancer without DNS failover)"
  ],
  "cachingEvaluation": "Analysis of caching layers (Redis/CDN) and cache invalidation risk.",
  "databaseStrategy": "Evaluation of read/write splitting, replication, or partitioning.",
  "strengths": [
    "Clear separation of concerns", "Good decoupled message queue usage"
  ],
  "recommendations": [
    "Concrete architectural improvement 1",
    "Concrete architectural improvement 2"
  ]
}
`;