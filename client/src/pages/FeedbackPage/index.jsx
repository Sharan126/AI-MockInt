import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInterview } from '../../services/interviewService.js';
import ScoreCard from '../../components/ScoreCard';
import RadarChart from '../../components/RadarChart';
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
} from 'react-icons/bs';
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

  const { feedback, role, overallScore, questions = [], messages = [] } = interview;
  const { categoryScores, strengths, areasOfImprovement, finalAssessment } =
    feedback;

  const candidateMessages = messages.filter((m) => m.role === 'candidate');

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
        {/* Printable Official Header (Shown during window.print) */}
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
            <div className="feedback-role-badge">{role}</div>
            <h1 className="feedback-heading">Interview Performance Report</h1>
            <p className="feedback-date-text">
              Conducted on{' '}
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
        <div className="feedback-overall-section">
          <div
            className="feedback-score-circle"
            style={{ borderColor: getScoreColor(overallScore) }}
          >
            <span
              className="feedback-score-number"
              style={{ color: getScoreColor(overallScore) }}
            >
              {overallScore}
            </span>
            <span className="feedback-score-label">/100</span>
          </div>

          <div className="feedback-readiness-info">
            <h2 className="feedback-overall-title">Overall Score</h2>
            <div
              className="readiness-pill"
              style={{
                borderColor: readinessColor,
                color: readinessColor,
                backgroundColor: `${readinessColor}15`,
              }}
            >
              <BsPatchCheckFill />
              <span>{readinessTier}</span>
            </div>
          </div>
        </div>

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
