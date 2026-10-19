import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiFileText,
  FiUploadCloud,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiCopy,
  FiCheck,
  FiArrowRight,
  FiAward,
} from 'react-icons/fi';
import { BsBullseye, BsLightningChargeFill } from 'react-icons/bs';
import { getResume, optimizeResume } from '../../services/interviewService.js';
import './index.css';

const ROLES = [
  'Full Stack Developer',
  'Frontend Engineer',
  'Backend Engineer',
  'System Architect',
  'DevOps / Cloud Engineer',
  'Data Engineer',
  'Mobile Developer',
  'Engineering Manager',
];

const ResumeOptimizerPage = () => {
  const navigate = useNavigate();
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExisting = async () => {
      setLoading(true);
      try {
        const data = await getResume();
        if (data && data.resumeText) {
          setResumeText(data.resumeText);
        }
      } catch (err) {
        // Resume might not exist yet, ignore
      } finally {
        setLoading(false);
      }
    };
    fetchExisting();
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!resumeText.trim() || resumeText.length < 30) {
      setError('Please enter or upload a detailed resume (at least 30 characters).');
      return;
    }

    setError(null);
    setAnalyzing(true);
    try {
      const data = await optimizeResume(resumeText, targetRole);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 65) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="resume-optimizer-page">
      <div className="optimizer-header">
        <div className="optimizer-badge">
          <FiAward className="opt-badge-icon" /> AI ATS Intelligence
        </div>
        <h1 className="optimizer-title">AI Resume ATS Optimizer Studio</h1>
        <p className="optimizer-subtitle">
          Audit your resume against FAANG applicant tracking systems, discover missing keywords, and transform weak bullets into quantified STAR statements.
        </p>
      </div>

      <div className="optimizer-layout">
        {/* Input Form Column */}
        <div className="optimizer-input-card">
          <div className="card-header-inner">
            <FiFileText className="ch-icon" />
            <div>
              <h3>Resume Content</h3>
              <p>Review or paste your work history and skills</p>
            </div>
          </div>

          <form onSubmit={handleAnalyze} className="opt-form">
            <div className="form-group">
              <label>Target Interview Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="opt-select"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Resume Text / Experience</label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume content, experience descriptions, and technical skills..."
                rows={12}
                className="opt-textarea"
                required
              />
            </div>

            {error && <div className="opt-error-alert">{error}</div>}

            <button
              type="submit"
              className="btn-opt-analyze"
              disabled={analyzing || !resumeText.trim()}
            >
              <BsLightningChargeFill />
              {analyzing ? 'Scanning with ATS Engine...' : 'Analyze & Optimize Resume'}
            </button>
          </form>
        </div>

        {/* Results Column */}
        <div className="optimizer-results-column">
          {!result && !analyzing && (
            <div className="empty-results-placeholder">
              <div className="empty-results-icon">
                <FiTrendingUp />
              </div>
              <h3>Ready for ATS Audit</h3>
              <p>
                Click "Analyze & Optimize Resume" to get an ATS score, action-verb breakdown, keyword gap analysis, and STAR rewrites.
              </p>
            </div>
          )}

          {analyzing && (
            <div className="analyzing-loader-box">
              <div className="spinner-glow" />
              <h3>Benchmarking against {targetRole} standards...</h3>
              <p>Evaluating action verbs, quantifying metrics, and identifying keyword gaps</p>
            </div>
          )}

          {result && (
            <div className="results-container">
              {/* Score summary banner */}
              <div className="ats-score-banner">
                <div className="gauge-box">
                  <svg className="ats-gauge-svg" viewBox="0 0 100 100">
                    <circle className="gauge-bg-circle" cx="50" cy="50" r="40" />
                    <circle
                      className="gauge-fill-circle"
                      cx="50"
                      cy="50"
                      r="40"
                      strokeDasharray={251.3}
                      strokeDashoffset={251.3 - (251.3 * (result.atsScore || 0)) / 100}
                      style={{ stroke: getScoreColor(result.atsScore) }}
                    />
                    <text x="50" y="48" className="ats-gauge-num" textAnchor="middle">
                      {result.atsScore}
                    </text>
                    <text x="50" y="62" className="ats-gauge-label" textAnchor="middle">
                      ATS SCORE
                    </text>
                  </svg>
                </div>

                <div className="score-summary-details">
                  <div className="score-metrics-row">
                    <div className="sub-metric">
                      <span className="sub-label">Action Verbs</span>
                      <span className="sub-val" style={{ color: getScoreColor(result.actionVerbsScore) }}>
                        {result.actionVerbsScore}%
                      </span>
                    </div>
                    <div className="sub-metric">
                      <span className="sub-label">Quantified Impact</span>
                      <span className="sub-val" style={{ color: getScoreColor(result.quantifiableMetricsScore) }}>
                        {result.quantifiableMetricsScore}%
                      </span>
                    </div>
                  </div>
                  <p className="ats-summary-text">{result.summary}</p>
                </div>
              </div>

              {/* Keywords Analysis */}
              <div className="keywords-grid">
                <div className="keyword-card matched">
                  <h4>
                    <FiCheckCircle className="kw-icon text-emerald" />
                    Matched ATS Keywords ({result.matchedKeywords?.length || 0})
                  </h4>
                  <div className="tags-flex">
                    {result.matchedKeywords?.map((kw, i) => (
                      <span key={i} className="kw-tag matched">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="keyword-card missing">
                  <h4>
                    <FiAlertCircle className="kw-icon text-amber" />
                    Missing Recommended Keywords ({result.missingKeywords?.length || 0})
                  </h4>
                  <div className="tags-flex">
                    {result.missingKeywords?.map((kw, i) => (
                      <span key={i} className="kw-tag missing">
                        + {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* High-Impact STAR Bullet Rewrites */}
              {result.bulletImprovements && result.bulletImprovements.length > 0 && (
                <div className="bullet-rewrites-section">
                  <h3 className="section-title">
                    <BsBullseye className="st-icon" />
                    Quantified STAR Bullet Transformations
                  </h3>

                  <div className="bullets-list">
                    {result.bulletImprovements.map((item, idx) => (
                      <div key={idx} className="bullet-transform-card">
                        <div className="bullet-original">
                          <span className="bullet-label before">Before</span>
                          <p>{item.original}</p>
                        </div>

                        <div className="bullet-improved">
                          <div className="improved-top">
                            <span className="bullet-label after">AI STAR Optimized</span>
                            <button
                              className="btn-copy-bullet"
                              onClick={() => handleCopy(item.improved, idx)}
                              title="Copy to clipboard"
                            >
                              {copiedIdx === idx ? (
                                <>
                                  <FiCheck /> Copied
                                </>
                              ) : (
                                <>
                                  <FiCopy /> Copy
                                </>
                              )}
                            </button>
                          </div>
                          <p className="improved-text">{item.improved}</p>
                          {item.reason && (
                            <div className="bullet-reason">
                              <strong>Why this wins:</strong> {item.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next step CTA */}
              <div className="opt-cta-card">
                <div>
                  <h4>Practice with this Profile</h4>
                  <p>Start a tailored mock interview grounded directly in your optimized background.</p>
                </div>
                <button
                  className="btn-start-grounded"
                  onClick={() => navigate('/interview/setup')}
                >
                  Start Grounded Interview <FiArrowRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeOptimizerPage;
