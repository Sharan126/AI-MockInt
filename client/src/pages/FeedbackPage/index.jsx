import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInterview, shareInterview } from '../../services/interviewService.js';
import ScoreCard from '../../components/ScoreCard';
import RadarChart from '../../components/RadarChart';
import GameFilmPlayer from '../../components/GameFilmPlayer/index.jsx';
import getScoreColor from '../../constants/scoreColors.js';
import {
  BsCheckCircleFill,
  BsArrowUpRight,
  BsJournalText,
  BsArrowRepeat,
  BsPrinterFill,
  BsLightbulbFill,
  BsPersonBadgeFill,
  BsCodeSlash,
  BsChevronDown,
  BsChevronUp,
  BsPatchCheckFill,
  BsMicFill,
  BsBuildingCheck,
  BsSpeedometer2,
  BsDiagram3,
  BsAwardFill,
  BsEyeFill,
  BsPersonCheckFill,
} from 'react-icons/bs';
import { FiShare2, FiFileText, FiArrowRight, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './index.css';

/**
 * Generates structured senior staff engineer model answer guidelines
 * tailored to the question content and role.
 */
function getModelAnswerForQuestion(question, role = 'Software Engineer') {
  const text = (question?.text || '').toLowerCase();
  const isCode = question?.isCodeQuestion;

  if (text.includes('about yourself') || text.includes('introduce')) {
    return {
      framework: 'Present -> Past -> Future (STAR)',
      keyHighlights: [
        'Present: Current technical role, domain focus, and recent flagship impact.',
        'Past: Formative engineering challenges, scalable systems built, or architectural transitions.',
        'Future: Why this target role excites you and how your strengths align with team objectives.',
      ],
      idealResponse:
        "“I am a software engineer specializing in scalable full-stack and distributed architectures. Most recently, I led the redesign of a high-throughput microservice handling 15M+ daily requests, reducing p99 latency by 42%. Prior to that, I spent 3 years engineering resilient APIs and reactive frontends. What draws me to this role is the opportunity to tackle distributed data challenges and mentor junior engineers while building high-leverage products.”",
    };
  }

  if (isCode || text.includes('code') || text.includes('algorithm') || text.includes('complexity')) {
    return {
      framework: 'Clarify -> Baseline -> Optimal -> Edge Cases',
      keyHighlights: [
        'Clarify constraints: data types, input range, memory constraints, and time limits.',
        'Discuss complexity: explicitly state Time O(N) and Space O(1) trade-offs before typing.',
        'Address edge cases: null/empty inputs, duplicates, integer overflow, and concurrency.',
      ],
      idealResponse:
        "“To solve this cleanly, a brute-force approach with nested loops takes O(N²). We can optimize to linear O(N) time using a hash map or two-pointer technique. Let's maintain a seen lookup table to achieve single-pass lookup. For edge cases, we validate against null inputs and empty collections at the boundary.”",
    };
  }

  if (text.includes('conflict') || text.includes('disagree') || text.includes('challenge') || text.includes('mistake')) {
    return {
      framework: 'STAR (Situation, Task, Action, Result)',
      keyHighlights: [
        'Depersonalize conflict: focus strictly on data, metrics, and customer outcomes.',
        'Demonstrate active listening: acknowledge the other perspective before advocating your proposal.',
        'Deliverable impact: summarize how the team resolved the issue and instituted safeguards.',
      ],
      idealResponse:
        "“On a previous critical release, our team had conflicting opinions on whether to adopt GraphQL or stick with REST. I proposed running a 2-day proof of concept measuring payload sizes, client caching efficiency, and maintenance overhead. The empirical data demonstrated a 35% reduction in mobile bandwidth for our specific workload, which built consensus across both frontend and backend leads.”",
    };
  }

  return {
    framework: 'Senior Engineering First Principles',
    keyHighlights: [
      'State core principle and architectural trade-offs immediately.',
      'Provide concrete examples with production scale and measurable metrics.',
      'Reflect on operational observability, failure isolation, and testing strategy.',
    ],
    idealResponse:
      `“When architecting solutions for ${role}, I prioritize high cohesion, low coupling, and verifiable reliability. I ensure systems are equipped with structured logging, distributed tracing, and clear SLOs so regressions are caught long before impacting production users.”`,
  };
}

function FeedbackPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState(0);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const data = await getInterview(id);
        setInterview(data);
      } catch (err) {
        toast.error('Failed to load feedback');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchInterview();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const res = await shareInterview(id);
      const fullUrl = `${window.location.origin}${res.shareUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      toast.success('Shareable review link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to generate share link');
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="feedback-loading-state">
        <div className="spinner-border spinner-border-sm" role="status" />
        <p className="feedback-loading-text">Loading feedback report...</p>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="feedback-loading-state">
        <p className="feedback-loading-text">Interview not found.</p>
        <button
          className="feedback-btn-outline"
          style={{ marginTop: '1rem' }}
          onClick={() => navigate('/')}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!interview.feedback) {
    return (
      <div className="feedback-loading-state">
        <p className="feedback-loading-text">Feedback report is being prepared...</p>
        <button
          className="feedback-btn-primary"
          style={{ marginTop: '1rem' }}
          onClick={() => navigate('/')}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const {
    feedback,
    role,
    overallScore,
    companyTrack = 'General',
    interviewerPersona = 'Natalie',
    jobDescription = '',
    speechMetrics,
    committeeVote,
    visionMetrics,
    isSuperday,
    questions = [],
    messages = [],
  } = interview;

  const { categoryScores, strengths, areasOfImprovement, finalAssessment } =
    feedback;

  const candidateMessages = messages.filter((m) => m.role === 'candidate');

  // Compute or extract speech intelligence metrics
  const combinedText = candidateMessages.map((m) => m.content || '').join(' ');
  const words = combinedText.trim().split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  const fillerRegex = /\b(um|uh|er|ah|like|you know|sort of|kind of|basically|actually|literally|i mean)\b/gi;
  const matches = combinedText.match(fillerRegex) || [];
  const fillerCount = matches.length;
  const uniqueFillers = [...new Set(matches.map((m) => m.toLowerCase()))];
  const estimatedMinutes = Math.max(1, candidateMessages.length * 0.75);
  const calculatedWpm = Math.round(totalWords / estimatedMinutes) || 135;
  const fluencyScore = Math.max(
    45,
    Math.min(98, Math.round(100 - (fillerCount / (totalWords || 1)) * 250))
  );

  const speech = speechMetrics || {
    totalWords,
    wpm: calculatedWpm,
    fillerCount,
    fillerWords: uniqueFillers,
    fluencyScore,
  };

  // Readiness badge calculation
  let readinessTier = 'Practice Recommended';
  let readinessColor = '#f59e0b';
  if (overallScore >= 85) {
    readinessTier = 'FAANG / Tier-1 Ready 🚀';
    readinessColor = '#10b981';
  } else if (overallScore >= 70) {
    readinessTier = 'Strong Mid-to-Senior Candidate ✨';
    readinessColor = '#2563eb';
  }

  return (
    <div className="feedback-page">
      <div className="feedback-container">
        {/* Printable Official Header */}
        <div className="print-certificate-header">
          <div className="print-logo-row">
            <span className="print-logo-title">MockInt AI</span>
            <span className="print-badge-verified">OFFICIAL PERFORMANCE EVALUATION</span>
          </div>
          <div className="print-meta-grid">
            <div>
              <strong>Target Role:</strong> {role}
            </div>
            <div>
              <strong>Track Preset:</strong> {companyTrack} Track
            </div>
            <div>
              <strong>Interviewer:</strong> {interviewerPersona}
            </div>
            <div>
              <strong>Assessment Date:</strong>{' '}
              {new Date(interview.createdAt).toLocaleDateString()}
            </div>
            <div>
              <strong>Overall Score:</strong> {overallScore}/100
            </div>
            <div>
              <strong>Candidate Tier:</strong> {readinessTier}
            </div>
          </div>
        </div>

        {/* Top Header Bar */}
        <div className="feedback-header">
          <div className="feedback-header-content">
            <div className="feedback-badges-row">
              <span className="feedback-role-badge">{role}</span>
              <span className="feedback-track-badge">
                <BsBuildingCheck /> {companyTrack} Track
              </span>
              {jobDescription && (
                <span className="feedback-jd-badge">Target Job Linked</span>
              )}
            </div>

            <h1 className="feedback-heading">Interview Performance Report</h1>
            <p className="feedback-date-text">
              Conducted with {interviewerPersona} on{' '}
              {new Date(interview.createdAt).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="feedback-header-actions">
            <button
              type="button"
              className="feedback-btn-share"
              onClick={handleShare}
              title="Share report with mentor or peer"
              disabled={sharing}
            >
              <FiShare2 className="pdf-icon" />
              <span>{sharing ? 'Generating Link...' : 'Share Review Link'}</span>
            </button>
            <button
              type="button"
              className="feedback-btn-pdf"
              onClick={handlePrint}
              title="Print or Save as PDF"
            >
              <BsPrinterFill className="pdf-icon" />
              <span>Download PDF Report</span>
            </button>
          </div>
        </div>

        {/* Overall Score & Readiness Section */}
        <div className="feedback-overall-section glass-card">
          <div className="feedback-score-gauge-col">
            <svg className="feedback-score-svg" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="scoreRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <circle className="gauge-bg-circle" cx="60" cy="60" r="48" />
              <circle
                className="gauge-fill-circle"
                cx="60"
                cy="60"
                r="48"
                strokeDasharray={301.6}
                strokeDashoffset={301.6 - (301.6 * (overallScore || 0)) / 100}
                stroke="url(#scoreRingGradient)"
              />
              <text x="60" y="56" className="feedback-gauge-score" textAnchor="middle">
                {overallScore}
              </text>
              <text x="60" y="74" className="feedback-gauge-total" textAnchor="middle">
                / 100
              </text>
            </svg>
          </div>

          <div className="feedback-readiness-info">
            <div className="badge-holographic feedback-readiness-holo">
              <BsPatchCheckFill className="holo-check-icon" />
              <span>{readinessTier}</span>
            </div>
            <h2 className="feedback-overall-title">Comprehensive Readiness Index</h2>
            <p className="feedback-readiness-summary">
              Synthesized across algorithm complexity, STAR behavioral delivery, speech pace, and vision telemetry.
            </p>
          </div>
        </div>

        {/* Audio Game Film Session Replay */}
        {messages && messages.length > 0 && (
          <GameFilmPlayer
            messages={messages}
            interviewerPersona={interviewerPersona}
          />
        )}

        {/* Real-Time Speech & Soft-Skills Intelligence Card */}
        <div className="feedback-speech-card">
          <div className="speech-card-header">
            <div className="speech-title-group">
              <BsMicFill className="speech-icon" />
              <div>
                <h3 className="speech-card-title">Speech & Delivery Intelligence</h3>
                <p className="speech-card-sub">
                  Real-time analysis of verbal fluency, speaking velocity, and filler crutches.
                </p>
              </div>
            </div>
            <div className="fluency-pill">
              Fluency Score: <strong>{speech.fluencyScore}%</strong>
            </div>
          </div>

          <div className="speech-metrics-grid">
            <div className="speech-metric-box">
              <span className="metric-box-label">Speaking Velocity</span>
              <div className="metric-box-val-row">
                <BsSpeedometer2 className="metric-inline-icon" />
                <span className="metric-box-number">{speech.wpm}</span>
                <span className="metric-box-unit">WPM</span>
              </div>
              <span className="metric-box-hint">
                {speech.wpm >= 125 && speech.wpm <= 165
                  ? '✨ Ideal FAANG Pacing (130-160 WPM)'
                  : speech.wpm < 125
                  ? '⚠️ Slightly hesitant / slow delivery'
                  : '⚠️ Rushing thoughts / fast delivery'}
              </span>
            </div>

            <div className="speech-metric-box">
              <span className="metric-box-label">Filler Words</span>
              <div className="metric-box-val-row">
                <span className="metric-box-number">{speech.fillerCount}</span>
                <span className="metric-box-unit">detected</span>
              </div>
              <span className="metric-box-hint">
                {speech.fillerCount === 0
                  ? '🏆 High verbal precision'
                  : speech.fillerWords.length > 0
                  ? `Used: ${speech.fillerWords.slice(0, 3).map((w) => `"${w}"`).join(', ')}`
                  : 'Low filler frequency'}
              </span>
            </div>

            <div className="speech-metric-box">
              <span className="metric-box-label">Total Spoken Words</span>
              <div className="metric-box-val-row">
                <span className="metric-box-number">{speech.totalWords}</span>
                <span className="metric-box-unit">words</span>
              </div>
              <span className="metric-box-hint">
                {speech.totalWords > 200
                  ? 'Detailed elaboration provided'
                  : 'Concise structured answers'}
              </span>
            </div>
          </div>
        </div>

        {/* FAANG Hiring Committee Packet (Superday Mode) */}
        {(committeeVote || isSuperday) && (
          <div className="feedback-committee-card">
            <div className="committee-header">
              <div className="committee-title-group">
                <BsAwardFill className="committee-award-icon" />
                <div>
                  <div className="committee-badge-row">
                    <span className="committee-tag">FAANG HIRING COMMITTEE PACKET</span>
                    {committeeVote?.calibratedLevel && (
                      <span className="committee-level-badge">
                        Calibration: <strong>{committeeVote.calibratedLevel}</strong>
                      </span>
                    )}
                  </div>
                  <h3 className="committee-card-title">Superday Consensus Decision</h3>
                </div>
              </div>

              {committeeVote?.consensusVote && (
                <div
                  className={`committee-consensus-badge vote-${committeeVote.consensusVote.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                >
                  <BsPersonCheckFill />
                  <span>{committeeVote.consensusVote.toUpperCase()}</span>
                </div>
              )}
            </div>

            {committeeVote?.summaryReasoning && (
              <blockquote className="committee-summary-quote">
                “{committeeVote.summaryReasoning}”
              </blockquote>
            )}

            {/* Debaters grid */}
            {committeeVote?.debaterPerspectives && (
              <div className="committee-debaters-grid">
                {committeeVote.debaterPerspectives.map((debater, idx) => (
                  <div key={idx} className="debater-card">
                    <div className="debater-header">
                      <span className="debater-role">{debater.role}</span>
                      <span
                        className={`debater-verdict ${
                          debater.verdict.toLowerCase().includes('hire')
                            ? 'verdict-hire'
                            : 'verdict-nohire'
                        }`}
                      >
                        {debater.verdict}
                      </span>
                    </div>
                    <p className="debater-comment">{debater.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {committeeVote?.levelingGapAnalysis && (
              <div className="committee-gap-box">
                <strong>📈 Leveling Calibration & Gap Analysis:</strong>
                <p>{committeeVote.levelingGapAnalysis}</p>
              </div>
            )}
          </div>
        )}

        {/* Executive Presence & Non-Verbal Telemetry Card */}
        {visionMetrics && (
          <div className="feedback-vision-card">
            <div className="speech-card-header">
              <div className="speech-title-group">
                <BsEyeFill className="vision-header-icon" />
                <div>
                  <h3 className="speech-card-title">Executive Presence & Vision Telemetry</h3>
                  <p className="speech-card-sub">
                    Webcam canvas analysis measuring eye contact consistency, posture composure, and camera framing.
                  </p>
                </div>
              </div>
              <div className="fluency-pill" style={{ borderColor: '#38bdf8', color: '#38bdf8' }}>
                Presence Score: <strong>{visionMetrics.overallPresence || 88}%</strong>
              </div>
            </div>

            <div className="speech-metrics-grid">
              <div className="speech-metric-box">
                <span className="metric-box-label">Eye Contact Consistency</span>
                <div className="metric-box-val-row">
                  <span className="metric-box-number">{visionMetrics.eyeContactScore || 88}</span>
                  <span className="metric-box-unit">%</span>
                </div>
                <span className="metric-box-hint">
                  {visionMetrics.eyeContactScore >= 85
                    ? '✨ Strong engagement with lens'
                    : 'Frequent gaze deviation from interviewer'}
                </span>
              </div>

              <div className="speech-metric-box">
                <span className="metric-box-label">Composure & Stability</span>
                <div className="metric-box-val-row">
                  <span className="metric-box-number">{visionMetrics.composureScore || 92}</span>
                  <span className="metric-box-unit">%</span>
                </div>
                <span className="metric-box-hint">
                  {visionMetrics.stability === 'Steady'
                    ? '🏆 High composure; calm body posture'
                    : 'Normal movement & gestures'}
                </span>
              </div>

              <div className="speech-metric-box">
                <span className="metric-box-label">Framing & Lighting</span>
                <div className="metric-box-val-row">
                  <span className="metric-box-number">{visionMetrics.framingScore || 90}</span>
                  <span className="metric-box-unit">%</span>
                </div>
                <span className="metric-box-hint">
                  Centered portrait framing with balanced key lighting.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Visual Analytics: Radar Chart & Category Scores */}
        <div className="feedback-analytics-layout">
          {categoryScores && (
            <div className="analytics-radar-col">
              <RadarChart categoryScores={categoryScores} />
            </div>
          )}

          <div className="analytics-cards-col">
            <h2 className="feedback-section-heading">Detailed Competencies</h2>
            <div className="feedback-scores-grid">
              {categoryScores && (
                <>
                  <ScoreCard
                    label="Communication Skills"
                    score={categoryScores.communicationSkills?.score || 0}
                    comment={categoryScores.communicationSkills?.comment}
                  />
                  <ScoreCard
                    label="Technical Knowledge"
                    score={categoryScores.technicalKnowledge?.score || 0}
                    comment={categoryScores.technicalKnowledge?.comment}
                  />
                  <ScoreCard
                    label="Problem Solving"
                    score={categoryScores.problemSolving?.score || 0}
                    comment={categoryScores.problemSolving?.comment}
                  />
                  <ScoreCard
                    label="Code Quality"
                    score={categoryScores.codeQuality?.score || 0}
                    comment={categoryScores.codeQuality?.comment}
                  />
                  <ScoreCard
                    label="Confidence"
                    score={categoryScores.confidence?.score || 0}
                    comment={categoryScores.confidence?.comment}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Key Strengths & Areas of Improvement Callouts */}
        <div className="feedback-insights-grid">
          {strengths && strengths.length > 0 && (
            <div className="feedback-callout feedback-callout-success">
              <div className="feedback-callout-header">
                <BsCheckCircleFill className="feedback-callout-icon-success" />
                <h2 className="feedback-callout-heading">Key Strengths</h2>
              </div>
              <ul className="feedback-callout-list">
                {strengths.map((item, index) => (
                  <li key={index} className="feedback-callout-list-item">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {areasOfImprovement && areasOfImprovement.length > 0 && (
            <div className="feedback-callout feedback-callout-warning">
              <div className="feedback-callout-header">
                <BsArrowUpRight className="feedback-callout-icon-warning" />
                <h2 className="feedback-callout-heading">
                  Targeted Growth Areas
                </h2>
              </div>
              <ul className="feedback-callout-list">
                {areasOfImprovement.map((item, index) => (
                  <li key={index} className="feedback-callout-list-item">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Final Assessment Banner */}
        {finalAssessment && (
          <div className="feedback-callout feedback-callout-blue">
            <div className="feedback-callout-header">
              <BsJournalText className="feedback-callout-icon-blue" />
              <h2 className="feedback-callout-heading">Executive Evaluation</h2>
            </div>
            <p className="feedback-assessment-text">{finalAssessment}</p>
          </div>
        )}

        {/* Question-by-Question Deep Dive & Model Answers */}
        {questions.length > 0 && (
          <div className="questions-comparison-section">
            <div className="comparison-section-header">
              <div>
                <h2 className="feedback-section-heading">
                  Question Breakdown & Model Answers
                </h2>
                <p className="comparison-subtitle">
                  Compare your actual response against how a Senior Staff Engineer
                  structures their answer.
                </p>
              </div>
            </div>

            <div className="questions-accordion-list">
              {questions.map((q, idx) => {
                const isExpanded = expandedQuestion === idx;
                const candidateAnswer =
                  candidateMessages[idx]?.content ||
                  'No verbal or typed answer recorded for this question.';
                const modelAnswer = getModelAnswerForQuestion(q, role);

                return (
                  <div
                    key={idx}
                    className={`question-accordion-card ${isExpanded ? 'is-expanded' : ''}`}
                  >
                    <button
                      type="button"
                      className="accordion-header-btn"
                      onClick={() =>
                        setExpandedQuestion(isExpanded ? null : idx)
                      }
                    >
                      <div className="accordion-title-left">
                        <span className="q-badge">Q{idx + 1}</span>
                        <span className="q-text">{q.text}</span>
                        {q.isCodeQuestion && (
                          <span className="q-code-tag">
                            <BsCodeSlash /> Code
                          </span>
                        )}
                      </div>
                      <div className="accordion-title-right">
                        {isExpanded ? <BsChevronUp /> : <BsChevronDown />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="accordion-body">
                        {/* Candidate Answer Box */}
                        <div className="answer-box candidate-answer-box">
                          <div className="box-header">
                            <BsPersonBadgeFill className="box-icon" />
                            <span className="box-title">Your Response</span>
                          </div>
                          <p className="box-content">{candidateAnswer}</p>
                        </div>

                        {/* Senior Staff Model Answer Box */}
                        <div className="answer-box model-answer-box">
                          <div className="box-header">
                            <BsLightbulbFill className="box-icon icon-gold" />
                            <span className="box-title">
                              Senior Staff Engineer Model Strategy
                            </span>
                            <span className="framework-tag">
                              {modelAnswer.framework}
                            </span>
                          </div>

                          <div className="highlights-list">
                            {modelAnswer.keyHighlights.map((hl, hlIdx) => (
                              <div key={hlIdx} className="highlight-item">
                                <span className="highlight-bullet">•</span>
                                <span>{hl}</span>
                              </div>
                            ))}
                          </div>

                          <div className="exemplar-quote">
                            <span className="exemplar-label">Exemplar Response:</span>
                            <p className="exemplar-text">
                              {modelAnswer.idealResponse}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* System Design Whiteboard Topology Snapshot */}
        {interview.whiteboardData && interview.whiteboardData.nodes && interview.whiteboardData.nodes.length > 0 && (
          <div className="feedback-whiteboard-summary">
            <div className="fws-header">
              <BsDiagram3 className="fws-icon" />
              <div>
                <h3 className="fws-title">System Architecture Topology Audited</h3>
                <p className="fws-sub">
                  Candidate designed a distributed topology with {interview.whiteboardData.nodes.length} components and {interview.whiteboardData.connections?.length || 0} data flows.
                </p>
              </div>
            </div>
            <div className="fws-nodes-row">
              {interview.whiteboardData.nodes.map((node, i) => (
                <span
                  key={i}
                  className="fws-node-pill"
                  style={{ borderLeftColor: node.color }}
                >
                  <span className="node-type">{node.type}:</span> {node.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ATS Studio Profile Grounding Callout */}
        <div
          className="feedback-ats-grounding-card"
          onClick={() => navigate('/resume-optimizer')}
        >
          <div className="ats-ground-left">
            <div className="ats-ground-badge">
              <FiFileText className="ats-ground-icon" />
            </div>
            <div>
              <h4 className="ats-ground-title">Benchmark & Polish Profile in ATS Optimizer Studio</h4>
              <p className="ats-ground-sub">
                Correlate your interview delivery against ATS keyword filters and get quantified STAR bullet points.
              </p>
            </div>
          </div>
          <button className="btn-ats-ground">
            Open ATS Studio <FiArrowRight />
          </button>
        </div>

        {/* Footer Actions */}
        <div className="feedback-actions-row">
          <button
            className="feedback-btn-primary"
            onClick={() => navigate('/setup')}
          >
            <BsArrowRepeat className="feedback-btn-icon" />
            Retake Interview
          </button>
          <button
            className="feedback-btn-outline"
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeedbackPage;
