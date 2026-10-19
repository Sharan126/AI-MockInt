import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  uploadResume,
  getResume,
  startInterview,
} from '../../services/interviewService.js';
import INTERVIEW_ROLES from '../../constants/roles.js';
import DIFFICULTY_LEVELS from '../../constants/difficulty.js';
import {
  BsDisplay,
  BsServer,
  BsLightningFill,
  BsGraphUp,
  BsCloudFill,
  BsStarFill,
  BsStar,
  BsFileEarmarkArrowUp,
  BsCheckCircleFill,
  BsBriefcaseFill,
  BsPersonBadgeFill,
  BsBuildingCheck,
  BsBullseye,
  BsFileTextFill,
  BsFire,
} from 'react-icons/bs';
import { FaPython, FaReact, FaJava } from 'react-icons/fa';
import { FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './index.css';

const ROLE_ICONS = {
  'frontend-developer': BsDisplay,
  'backend-developer': BsServer,
  'full-stack-developer': BsLightningFill,
  'data-analyst': BsGraphUp,
  'devops-engineer': BsCloudFill,
  'python-developer': FaPython,
  'react-developer': FaReact,
  'java-developer': FaJava,
};

const DIFFICULTY_ICONS = {
  easy: (
    <span className="setup-difficulty-stars">
      <BsStarFill className="setup-star-filled" />
      <BsStar className="setup-star-empty" />
      <BsStar className="setup-star-empty" />
    </span>
  ),
  medium: (
    <span className="setup-difficulty-stars">
      <BsStarFill className="setup-star-filled" />
      <BsStarFill className="setup-star-filled" />
      <BsStar className="setup-star-empty" />
    </span>
  ),
  hard: (
    <span className="setup-difficulty-stars">
      <BsStarFill className="setup-star-filled" />
      <BsStarFill className="setup-star-filled" />
      <BsStarFill className="setup-star-filled" />
    </span>
  ),
};

const COMPANY_TRACKS = [
  {
    id: 'General',
    label: 'General Tech Track',
    badge: 'Standard',
    desc: 'Balanced FAANG-grade technical, behavioral, and problem-solving interview.',
    icon: '🌐',
  },
  {
    id: 'Amazon',
    label: 'Amazon Track',
    badge: '16 LP & STAR',
    desc: 'Bar-raiser focus on Amazon Leadership Principles, customer obsession, and scale.',
    icon: '📦',
  },
  {
    id: 'Google',
    label: 'Google Track',
    badge: 'Algorithms & Scale',
    desc: 'Algorithmic optimality, deep edge cases, and architectural trade-offs.',
    icon: '🔍',
  },
  {
    id: 'Meta',
    label: 'Meta Track',
    badge: 'High Velocity',
    desc: 'Rapid execution, clean modular API design, and distributed throughput.',
    icon: '♾️',
  },
  {
    id: 'Startup',
    label: 'Startup / YC Track',
    badge: 'Pragmatic MVP',
    desc: 'Autonomous problem-solving, product intuition, and shipping fast under constraints.',
    icon: '🚀',
  },
];

const INTERVIEWER_PERSONAS = [
  {
    id: 'Natalie',
    name: 'Natalie',
    title: 'Senior Hiring Manager',
    desc: 'Encouraging, conversational, and supportive. Ideal for practicing flow and confidence.',
    avatarColor: '#2563eb',
    badge: 'Supportive',
  },
  {
    id: 'Marcus',
    name: 'Marcus',
    title: 'Staff Systems Architect',
    desc: 'Direct and analytical. Probes deep into failure recovery, concurrency, and complexity.',
    avatarColor: '#7c3aed',
    badge: 'Deep Tech & Strict',
  },
  {
    id: 'Elena',
    name: 'Elena',
    title: 'Engineering Director',
    desc: 'Focuses on cross-functional alignment, strategic roadmaps, and architectural trade-offs.',
    avatarColor: '#059669',
    badge: 'Executive & Vision',
  },
];

function InterviewSetupPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('General');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [selectedPersona, setSelectedPersona] = useState('Natalie');
  const [jobDescription, setJobDescription] = useState('');
  const [pressureMode, setPressureMode] = useState(false);
  const [isSuperday, setIsSuperday] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    const loadResume = async () => {
      try {
        const data = await getResume();
        if (data) {
          setResumeText(data.text);
          setResumeFileName(data.fileName);
        }
      } catch {
        // No resume found - that's okay
      }
    };

    loadResume();
  }, []);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file.');
      return;
    }

    setUploadingResume(true);

    try {
      const data = await uploadResume(file);
      setResumeText(data.text);
      setResumeFileName(data.fileName);
      toast.success('Resume uploaded successfully!');
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to upload resume';
      toast.error(message);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleStartInterview = async () => {
    if (!selectedRole) {
      toast.error('Please select a role.');
      return;
    }
    if (!resumeText) {
      toast.error('Please upload your resume.');
      return;
    }

    setLoading(true);

    try {
      const difficultyConfig = DIFFICULTY_LEVELS.find(
        (d) => d.id === selectedDifficulty
      );
      const totalQuestions = isSuperday ? 4 : (difficultyConfig ? difficultyConfig.questions : 5);

      const data = await startInterview(
        selectedRole,
        resumeText,
        totalQuestions,
        selectedTrack,
        selectedPersona,
        jobDescription,
        pressureMode,
        isSuperday
      );

      toast.success('Interview started!');
      navigate(`/interview/${data.interviewId}`, {
        state: { audio: data.audio },
      });
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to start interview';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !selectedRole) {
      toast.error('Please select an engineering role.');
      return;
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  if (loading) {
    return (
      <div className="setup-page">
        <div className="setup-preparing">
          <div className="spinner-border setup-preparing-spinner" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h2 className="setup-preparing-heading">
            Personalizing Your Interview...
          </h2>
          <p className="setup-preparing-text">
            Configuring <strong>{selectedTrack} Track</strong> with interviewer{' '}
            <strong>{selectedPersona}</strong> for the{' '}
            <strong>{selectedRole}</strong> loop.
          </p>
          <div className="setup-preparing-steps">
            <div className="setup-prep-step">
              <BsCheckCircleFill className="setup-prep-step-icon-active" />
              <span className="setup-prep-step-text">
                Analyzing resume against {selectedTrack} hiring bar
              </span>
            </div>
            {jobDescription && (
              <div className="setup-prep-step">
                <BsCheckCircleFill className="setup-prep-step-icon-active" />
                <span className="setup-prep-step-text">
                  Matching target job description & probing skill gaps
                </span>
              </div>
            )}
            <div className="setup-prep-step">
              <BsCheckCircleFill className="setup-prep-step-icon-active" />
              <span className="setup-prep-step-text">
                Generating questions & coding test cases
              </span>
            </div>
            <div className="setup-prep-step">
              <BsCheckCircleFill className="setup-prep-step-icon-pending" />
              <span className="setup-prep-step-text">
                Synthesizing {selectedPersona}&apos;s voice audio
              </span>
            </div>
          </div>
          <p className="setup-preparing-hint">
            This takes about 10-15 seconds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-page">
      <div className="setup-container">
        {/* Multi-Step Indicator */}
        <div className="setup-step-indicator">
          <span
            className={`setup-step-badge ${step >= 1 ? 'setup-step-active' : ''}`}
          >
            1. Role & Track
          </span>
          <span
            className={`setup-step-badge ${step >= 2 ? 'setup-step-active' : ''}`}
          >
            2. Difficulty & Persona
          </span>
          <span
            className={`setup-step-badge ${step >= 3 ? 'setup-step-active' : ''}`}
          >
            3. Job Match (Optional)
          </span>
          <span
            className={`setup-step-badge ${step >= 4 ? 'setup-step-active' : ''}`}
          >
            4. Resume & Launch
          </span>
        </div>

        {/* STEP 1: ROLE & COMPANY TRACK */}
        {step === 1 && (
          <div className="setup-section-wrapper">
            <div className="setup-section">
              <div className="section-title-row">
                <BsBriefcaseFill className="section-title-icon" />
                <div>
                  <h2 className="setup-section-heading">Select Engineering Role</h2>
                  <p className="setup-section-sub">
                    Pick the primary position you are targeting for this simulation.
                  </p>
                </div>
              </div>

              <div className="setup-roles-grid">
                {INTERVIEW_ROLES.map((role) => {
                  const RoleIcon = ROLE_ICONS[role.id];
                  return (
                    <button
                      key={role.id}
                      type="button"
                      className={`setup-role-card ${selectedRole === role.title ? 'setup-role-selected' : ''}`}
                      onClick={() => setSelectedRole(role.title)}
                    >
                      {RoleIcon && <RoleIcon className="setup-role-icon" />}
                      <h3 className="setup-role-title">{role.title}</h3>
                      <p className="setup-role-desc">{role.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="setup-section" style={{ marginTop: '32px' }}>
              <div className="section-title-row">
                <BsBuildingCheck className="section-title-icon" />
                <div>
                  <h2 className="setup-section-heading">
                    Target Company / Track Preset
                  </h2>
                  <p className="setup-section-sub">
                    Calibrate the interview loop, behavioral rubrics, and technical depth.
                  </p>
                </div>
              </div>

              <div className="setup-tracks-grid">
                {COMPANY_TRACKS.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    className={`setup-track-card ${selectedTrack === track.id ? 'setup-track-selected' : ''}`}
                    onClick={() => setSelectedTrack(track.id)}
                  >
                    <div className="track-card-header">
                      <span className="track-icon">{track.icon}</span>
                      <span className="track-badge">{track.badge}</span>
                    </div>
                    <h3 className="track-label">{track.label}</h3>
                    <p className="track-desc">{track.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DIFFICULTY & PERSONA */}
        {step === 2 && (
          <div className="setup-section-wrapper">
            <div className="setup-section">
              <h2 className="setup-section-heading">Choose Difficulty Level</h2>
              <div className="setup-difficulty-row">
                {DIFFICULTY_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    className={`setup-difficulty-card ${selectedDifficulty === level.id ? 'setup-difficulty-selected' : ''}`}
                    onClick={() => setSelectedDifficulty(level.id)}
                  >
                    {DIFFICULTY_ICONS[level.id]}
                    <h3 className="setup-difficulty-label">{level.label}</h3>
                    <p className="setup-difficulty-desc">{level.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="setup-section" style={{ marginTop: '32px' }}>
              <div className="section-title-row">
                <BsPersonBadgeFill className="section-title-icon" />
                <div>
                  <h2 className="setup-section-heading">
                    Choose Interviewer Personality
                  </h2>
                  <p className="setup-section-sub">
                    Select the demeanor of your AI interviewer.
                  </p>
                </div>
              </div>

              <div className="setup-personas-grid">
                {INTERVIEWER_PERSONAS.map((persona) => (
                  <button
                    key={persona.id}
                    type="button"
                    className={`setup-persona-card ${selectedPersona === persona.id ? 'setup-persona-selected' : ''}`}
                    onClick={() => setSelectedPersona(persona.id)}
                  >
                    <div className="persona-header">
                      <div
                        className="persona-avatar-dot"
                        style={{ backgroundColor: persona.avatarColor }}
                      />
                      <span className="persona-badge">{persona.badge}</span>
                    </div>
                    <h3 className="persona-name">{persona.name}</h3>
                    <span className="persona-role-title">{persona.title}</span>
                    <p className="persona-desc">{persona.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Pressure Mode Drill Toggle */}
            <div
              className={`pressure-mode-card ${pressureMode ? 'active' : ''}`}
              onClick={() => setPressureMode(!pressureMode)}
            >
              <div className="pressure-card-left">
                <div className="pressure-card-icon">
                  <BsFire />
                </div>
                <div>
                  <div className="pressure-card-header">
                    <strong>🔥 Bar Raiser Pressure Mode ("Grill Me Drill")</strong>
                    <span className="pressure-status-tag">
                      {pressureMode ? 'ENABLED' : 'OPTIONAL'}
                    </span>
                  </div>
                  <p className="pressure-card-desc">
                    AI interviewer challenges your responses with sharp follow-up pushback questions (edge cases, 100x traffic surges, trade-offs) before advancing.
                  </p>
                </div>
              </div>
              <div className="pressure-toggle-switch">
                <div className={`switch-handle ${pressureMode ? 'on' : ''}`} />
              </div>
            </div>

            {/* FAANG Superday Full-Loop Simulation Mode */}
            <div
              className={`pressure-mode-card ${isSuperday ? 'pressure-mode-active' : ''}`}
              style={{
                borderColor: isSuperday ? '#10b981' : undefined,
                background: isSuperday ? 'rgba(16, 185, 129, 0.08)' : undefined,
              }}
              onClick={() => setIsSuperday(!isSuperday)}
            >
              <div className="pressure-card-left">
                <div
                  className="pressure-icon-circle"
                  style={{
                    backgroundColor: isSuperday ? '#10b981' : undefined,
                    color: '#ffffff',
                  }}
                >
                  🏆
                </div>
                <div>
                  <div className="pressure-card-header">
                    <strong>FAANG "Superday" Full-Loop Simulation</strong>
                    <span
                      className="pressure-status-tag"
                      style={{
                        backgroundColor: isSuperday ? 'rgba(16, 185, 129, 0.2)' : undefined,
                        color: isSuperday ? '#10b981' : undefined,
                      }}
                    >
                      {isSuperday ? '4 ROUNDS ACTIVE' : 'STANDARD'}
                    </span>
                  </div>
                  <p className="pressure-card-desc">
                    Simulate the complete 4-round onsite loop (Screening, Algorithmic DSA, System Design, and Behavioral Bar Raiser) culminating in an official Hiring Committee consensus vote and leveling calibration.
                  </p>
                </div>
              </div>
              <div className="pressure-toggle-switch">
                <div
                  className={`switch-handle ${isSuperday ? 'on' : ''}`}
                  style={{ backgroundColor: isSuperday ? '#10b981' : undefined }}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: TARGET JOB DESCRIPTION MATCHER */}
        {step === 3 && (
          <div className="setup-section">
            <div className="section-title-row">
              <BsBullseye className="section-title-icon" />
              <div>
                <h2 className="setup-section-heading">
                  Target Job Description Matcher (Optional)
                </h2>
                <p className="setup-section-sub">
                  Paste the job posting from LinkedIn, Indeed, or the company career page.
                  MockInt AI will cross-reference your resume and generate questions that
                  target the exact required technologies and gap areas.
                </p>
              </div>
            </div>

            <div className="setup-job-desc-box">
              <textarea
                className="job-desc-textarea"
                rows={7}
                placeholder="Paste job description text here (e.g., 'We are seeking a Senior Backend Engineer proficient in Node.js, distributed databases, Kafka, and microservice architectures...')"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              <div className="job-desc-footer">
                <span className="job-desc-count">
                  {jobDescription.length} characters entered
                </span>
                {jobDescription.trim().length > 50 && (
                  <span className="job-desc-active-badge">
                    ✓ Tailoring questions to this job posting
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: RESUME & CONFIRMATION */}
        {step === 4 && (
          <div className="setup-section">
            <div className="section-title-row">
              <BsFileTextFill className="section-title-icon" />
              <div>
                <h2 className="setup-section-heading">Review & Upload Resume</h2>
                <p className="setup-section-sub">
                  We use your resume to ground behavioral and technical questions in your
                  real projects and experience.
                </p>
              </div>
            </div>

            {/* ATS Studio Callout */}
            <div
              className="setup-ats-callout"
              onClick={() => navigate('/resume-optimizer')}
            >
              <div className="ats-callout-left">
                <span className="ats-callout-pill">ATS Studio</span>
                <strong>Audit your resume against ATS filters & get STAR rewrites</strong>
              </div>
              <span className="ats-callout-btn">
                Open Studio <FiArrowRight />
              </span>
            </div>

            <div className="setup-resume-area">
              {resumeText ? (
                <div className="setup-resume-uploaded">
                  <div className="setup-resume-info">
                    <BsFileEarmarkArrowUp className="setup-resume-file-icon" />
                    <div>
                      <p className="setup-resume-name">{resumeFileName}</p>
                      <span className="setup-resume-ready-tag">
                        ✓ Ready for interview personalization
                      </span>
                    </div>
                  </div>
                  <label className="setup-change-resume-btn">
                    Change PDF
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleResumeUpload}
                      hidden
                    />
                  </label>
                </div>
              ) : (
                <label className="setup-upload-zone">
                  <BsFileEarmarkArrowUp className="setup-upload-icon" />
                  <p className="setup-upload-text">
                    {uploadingResume
                      ? 'Uploading & extracting text...'
                      : 'Click to upload PDF resume'}
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    disabled={uploadingResume}
                    hidden
                  />
                </label>
              )}
            </div>

            {/* Loop Summary Pill Box */}
            <div className="setup-summary-pill-box">
              <div className="summary-pill-item">
                <span className="summary-pill-label">Role:</span>
                <span className="summary-pill-val">{selectedRole}</span>
              </div>
              <div className="summary-pill-item">
                <span className="summary-pill-label">Track:</span>
                <span className="summary-pill-val">{selectedTrack}</span>
              </div>
              <div className="summary-pill-item">
                <span className="summary-pill-label">Difficulty:</span>
                <span className="summary-pill-val">{selectedDifficulty.toUpperCase()}</span>
              </div>
              <div className="summary-pill-item">
                <span className="summary-pill-label">Interviewer:</span>
                <span className="summary-pill-val">{selectedPersona}</span>
              </div>
              <div className="summary-pill-item">
                <span className="summary-pill-label">Pressure Drill:</span>
                <span className="summary-pill-val" style={{ color: pressureMode ? '#f59e0b' : 'inherit' }}>
                  {pressureMode ? '🔥 Enabled' : 'Off'}
                </span>
              </div>
              <div className="summary-pill-item">
                <span className="summary-pill-label">Superday:</span>
                <span className="summary-pill-val" style={{ color: isSuperday ? '#10b981' : 'inherit' }}>
                  {isSuperday ? '🏆 4-Round Loop' : 'Standard'}
                </span>
              </div>
              {jobDescription.trim() && (
                <div className="summary-pill-item">
                  <span className="summary-pill-label">Target Job:</span>
                  <span className="summary-pill-val">Custom JD Linked</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="setup-nav-buttons">
          {step > 1 && (
            <button
              type="button"
              className="setup-back-btn"
              onClick={handleBack}
            >
              Back
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              className="setup-next-btn"
              onClick={handleNext}
            >
              Next Step
            </button>
          ) : (
            <button
              type="button"
              className={`setup-start-btn ${
                loading || !selectedRole || !resumeText
                  ? 'setup-start-btn-disabled'
                  : ''
              }`}
              onClick={handleStartInterview}
              disabled={loading || !selectedRole || !resumeText}
            >
              Launch Mock Interview
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default InterviewSetupPage;
