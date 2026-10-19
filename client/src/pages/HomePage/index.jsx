import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { getHistory, deleteHistoryItem } from '../../services/historyService.js';
import InterviewCard from '../../components/InterviewCard';
import RoadmapCard from '../../components/RoadmapCard/index.jsx';
import {
  BsChatSquareTextFill,
  BsCheckCircleFill,
  BsTrophyFill,
  BsPlayCircleFill,
  BsChatSquareText,
  BsLightningChargeFill,
  BsFire,
  BsShieldCheck,
  BsCodeSlash,
  BsStars,
  BsCheck2Circle,
  BsArrowRight,
} from 'react-icons/bs';
import { FaAmazon } from 'react-icons/fa';
import {
  SiGoogle,
  SiMeta,
  SiApple,
} from 'react-icons/si';
import toast from 'react-hot-toast';
import './index.css';

// Daily blitz micro-questions pool
const DAILY_BLITZ_QUESTIONS = [
  {
    id: 'cache-stampede',
    category: 'System Design & Distributed Systems',
    difficulty: 'L5 / Senior',
    question: 'How do you prevent a Cache Breakdown (Stampede) when a high-traffic key expires under 100,000 QPS?',
    options: [
      { id: 'a', text: 'Distributed Mutex Lock (Singleflight) so only 1 worker rebuilds the cache', correct: true },
      { id: 'b', text: 'Increase HTTP gateway timeout from 5s to 60s to absorb queue delay', correct: false },
      { id: 'c', text: 'Evict all remaining keys instantly to relieve memory pressure', correct: false },
    ],
    explanation: 'Singleflight or Mutex locking ensures only one query hits the backend DB to regenerate the key, while all concurrent requests await the cached result.',
    xpAward: 50,
  },
  {
    id: 'idempotency-keys',
    category: 'API & Reliability Architecture',
    difficulty: 'L5 / Staff',
    question: 'Why should payment APIs require an Idempotency-Key header on POST requests?',
    options: [
      { id: 'a', text: 'To encrypt credit card numbers in transit', correct: false },
      { id: 'b', text: 'To safely retry network timeouts without double-charging the customer', correct: true },
      { id: 'c', text: 'To compress JSON payloads with gzip compression', correct: false },
    ],
    explanation: 'Idempotency keys prevent duplicate transaction executions when network retries or transient timeouts occur on state-changing endpoints.',
    xpAward: 50,
  },
];

function HomePage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [allInterviews, setAllInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Daily Blitz State
  const [blitzAnswered, setBlitzAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [blitzQuestion] = useState(DAILY_BLITZ_QUESTIONS[0]);
  const [bonusXp, setBonusXp] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getHistory();
        const list = Array.isArray(data) ? data : data?.interviews || [];
        setAllInterviews(list);
        setRecentInterviews(list.slice(0, 6));
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();

    // Check if daily blitz was already done today
    const storedBlitz = localStorage.getItem('daily_blitz_done');
    if (storedBlitz === new Date().toISOString().slice(0, 10)) {
      setBlitzAnswered(true);
      setBonusXp(50);
    }
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteHistoryItem(id);
      setAllInterviews((prev) => prev.filter((item) => item._id !== id));
      setRecentInterviews((prev) => prev.filter((item) => item._id !== id));
      toast.success('Interview deleted');
    } catch {
      toast.error('Failed to delete interview');
    }
  };

  const handleCardClick = (interview) => {
    if (interview.status === 'completed') {
      navigate(`/feedback/${interview._id}`);
    } else {
      navigate(`/interview/${interview._id}`);
    }
  };

  const handleBlitzSelect = (opt) => {
    if (blitzAnswered) return;
    setSelectedOption(opt.id);
    setBlitzAnswered(true);
    if (opt.correct) {
      setBonusXp(50);
      localStorage.setItem('daily_blitz_done', new Date().toISOString().slice(0, 10));
      toast.success('🎯 Correct! +50 XP awarded to your Flight Deck profile!');
    } else {
      toast.error('Not quite! Review the architectural explanation below.');
    }
  };

  const completedCount = allInterviews.filter((i) => i.status === 'completed').length;
  const scored = allInterviews.filter(
    (i) => typeof i.overallScore === 'number' || typeof i.score === 'number'
  );
  const avgScore = scored.length
    ? Math.round(
        scored.reduce((acc, i) => acc + (i.overallScore ?? i.score), 0) /
          scored.length
      )
    : 0;

  // XP & Level calculations
  const totalXp = completedCount * 350 + avgScore * 10 + bonusXp;
  const currentLevel = Math.max(1, Math.floor(totalXp / 800) + 1);
  const currentLevelProgress = Math.min(100, Math.round(((totalXp % 800) / 800) * 100));

  const LEVEL_TITLES = [
    'Junior Engineer (L3)',
    'Software Engineer (L4)',
    'Senior Systems Engineer (L5)',
    'Staff Architect (L6)',
    'Principal Engineer (L7)',
    'Distinguished Fellow (L8)',
  ];
  const levelTitle = LEVEL_TITLES[Math.min(currentLevel - 1, LEVEL_TITLES.length - 1)];

  // FAANG Target Readiness Scores
  const faangCompanies = [
    {
      name: 'Google',
      icon: SiGoogle,
      color: '#4285F4',
      score: completedCount > 0 ? Math.min(96, Math.max(68, avgScore + 4)) : 74,
      focus: 'Distributed Systems & DS/Algo',
      preset: { company: 'Google', role: 'Staff Software Engineer' },
    },
    {
      name: 'Meta',
      icon: SiMeta,
      color: '#0668E1',
      score: completedCount > 0 ? Math.min(94, Math.max(65, avgScore - 2)) : 70,
      focus: 'Product Architecture & Scale',
      preset: { company: 'Meta', role: 'Full Stack Engineer' },
    },
    {
      name: 'Amazon',
      icon: FaAmazon,
      color: '#FF9900',
      score: completedCount > 0 ? Math.min(98, Math.max(72, avgScore + 6)) : 82,
      focus: 'Leadership Principles & Bar Raiser',
      preset: { company: 'Amazon', role: 'Software Development Engineer II' },
    },
    {
      name: 'Apple',
      icon: SiApple,
      color: '#A2AAAD',
      score: completedCount > 0 ? Math.min(92, Math.max(64, avgScore + 1)) : 68,
      focus: 'Concurrency & Kernel Performance',
      preset: { company: 'Apple', role: 'Systems Engineer' },
    },
  ];

  const handleLaunchTargetPrep = (companyPreset) => {
    navigate('/setup', { state: { prefill: companyPreset } });
  };

  return (
    <div className="home-page">
      {/* Flight Deck Header */}
      <div className="home-hero-section">
        <div className="hero-text-col">
          <div className="hero-badge">
            <span className="live-pulse-dot"></span>
            <span>FAANG AI FLIGHT DECK</span>
            <span className="hero-badge-divider">•</span>
            <span className="hero-version">v2.5 PRO</span>
          </div>
          <h1 className="home-welcome-heading">
            Welcome back, <span className="text-gradient-primary">{user?.name?.split(' ')[0] || 'Engineer'}</span>
          </h1>
          <p className="home-welcome-subtitle">
            Simulate ultra-realistic FAANG interviews with real-time AI behavioral analysis,
            live code execution, and high-stakes salary negotiation.
          </p>
        </div>

        <div className="hero-action-col">
          <button
            className="btn-glow-primary hero-launch-btn"
            onClick={() => navigate('/setup')}
          >
            <BsPlayCircleFill className="hero-launch-icon" />
            <span>Launch Mock Interview</span>
          </button>
        </div>
      </div>

      {/* Flight Deck XP & Leveling Bar */}
      <div className="xp-flight-deck-bar glass-card">
        <div className="xp-level-badge">
          <span className="level-number">LVL {currentLevel}</span>
          <span className="level-title">{levelTitle}</span>
        </div>

        <div className="xp-progress-container">
          <div className="xp-progress-labels">
            <span className="xp-label-sub">
              Total Career XP: <strong>{totalXp.toLocaleString()} XP</strong>
            </span>
            <span className="xp-label-next">
              {currentLevelProgress}% towards Level {currentLevel + 1}
            </span>
          </div>
          <div className="xp-track">
            <div
              className="xp-fill-bar"
              style={{ width: `${currentLevelProgress}%` }}
            >
              <span className="xp-glow-particle"></span>
            </div>
          </div>
        </div>

        <div className="xp-perk-badge">
          <BsFire className="xp-fire-icon" />
          <span>Next Unlock: <strong>Staff Bar-Raiser Simulation</strong></span>
        </div>
      </div>

      {/* Readiness Dial Card + FAANG Matrix */}
      <div className="home-grid-top">
        {/* Readiness Index */}
        <div className="home-readiness-card glass-card">
          <div className="readiness-gauge-col">
            <svg className="readiness-gauge-svg" viewBox="0 0 100 100">
              <circle className="gauge-bg-circle" cx="50" cy="50" r="40" />
              <circle
                className="gauge-fill-circle"
                cx="50"
                cy="50"
                r="40"
                strokeDasharray={251.3}
                strokeDashoffset={
                  251.3 - (251.3 * (completedCount ? avgScore : 0)) / 100
                }
                style={{
                  stroke:
                    avgScore >= 85
                      ? '#10b981'
                      : avgScore >= 70
                      ? '#6366f1'
                      : avgScore > 0
                      ? '#f59e0b'
                      : '#64748b',
                }}
              />
              <text x="50" y="47" className="gauge-score-text" textAnchor="middle">
                {completedCount ? `${avgScore}%` : '—'}
              </text>
              <text x="50" y="62" className="gauge-sub-text" textAnchor="middle">
                READINESS
              </text>
            </svg>
          </div>

          <div className="readiness-details-col">
            <div
              className="readiness-tier-badge"
              style={{
                borderColor:
                  avgScore >= 85
                    ? '#10b981'
                    : avgScore >= 70
                    ? '#6366f1'
                    : '#f59e0b',
                color:
                  avgScore >= 85
                    ? '#10b981'
                    : avgScore >= 70
                    ? '#818cf8'
                    : '#fbbf24',
              }}
            >
              {completedCount === 0
                ? 'Benchmark Needed'
                : avgScore >= 85
                ? 'FAANG Ready (Top 5%) 🚀'
                : avgScore >= 70
                ? 'Strong Candidate ✨'
                : 'Accelerated Training 📚'}
            </div>
            <h2 className="readiness-title">Interview Readiness Index</h2>
            <p className="readiness-desc">
              {completedCount > 0
                ? `Synthesized from ${completedCount} sessions across technical, system design, and STAR behavioral telemetry.`
                : 'Complete your first high-stakes simulation to unlock your personalized FAANG readiness benchmark.'}
            </p>
          </div>
        </div>

        {/* FAANG Target Company Matrix */}
        <div className="faang-matrix-card glass-card">
          <div className="matrix-header">
            <h3 className="matrix-title">
              <BsShieldCheck className="matrix-icon" />
              Target Company Preparedness
            </h3>
            <span className="matrix-subtitle">Real-time match scoring</span>
          </div>

          <div className="faang-grid">
            {faangCompanies.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.name}
                  className="faang-tile"
                  onClick={() => handleLaunchTargetPrep(c.preset)}
                  title={`Launch target mock for ${c.name}`}
                >
                  <div className="faang-tile-header">
                    <Icon className="faang-company-icon" style={{ color: c.color }} />
                    <span className="faang-company-name">{c.name}</span>
                    <span className="faang-score-badge">{c.score}%</span>
                  </div>
                  <div className="faang-progress-bar">
                    <div
                      className="faang-progress-fill"
                      style={{ width: `${c.score}%`, backgroundColor: c.color }}
                    ></div>
                  </div>
                  <div className="faang-focus-row">
                    <span className="faang-focus-text">{c.focus}</span>
                    <BsArrowRight className="faang-arrow" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Daily 60-Second Architecture Blitz Challenge */}
      <div className="daily-blitz-card glass-card">
        <div className="blitz-header">
          <div className="blitz-badge">
            <BsLightningChargeFill className="blitz-icon" />
            <span>DAILY 60-SEC ARCHITECTURE BLITZ</span>
          </div>
          <div className="blitz-xp-reward">
            <BsStars className="xp-star-icon" />
            <span>+50 XP</span>
          </div>
        </div>

        <div className="blitz-body">
          <div className="blitz-meta">
            <span className="blitz-category">{blitzQuestion.category}</span>
            <span className="blitz-difficulty">{blitzQuestion.difficulty}</span>
          </div>
          <h3 className="blitz-question">{blitzQuestion.question}</h3>

          <div className="blitz-options">
            {blitzQuestion.options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              let btnClass = 'blitz-option-btn';
              if (blitzAnswered) {
                if (opt.correct) btnClass += ' correct';
                else if (isSelected) btnClass += ' incorrect';
              }
              return (
                <button
                  key={opt.id}
                  className={btnClass}
                  onClick={() => handleBlitzSelect(opt)}
                  disabled={blitzAnswered}
                >
                  <span className="option-letter">{opt.id.toUpperCase()}</span>
                  <span className="option-text">{opt.text}</span>
                  {blitzAnswered && opt.correct && (
                    <BsCheck2Circle className="option-check-icon" />
                  )}
                </button>
              );
            })}
          </div>

          {blitzAnswered && (
            <div className="blitz-explanation animate-fade-in">
              <strong>💡 Architectural Debrief: </strong>
              {blitzQuestion.explanation}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Career Roadmap */}
      <RoadmapCard user={user} />

      {/* Key Telemetry Stats Row */}
      <div className="home-stats-row">
        <div className="home-stat-card glass-card">
          <div className="stat-icon-wrapper stat-blue">
            <BsChatSquareTextFill className="home-stat-icon" />
          </div>
          <div className="stat-content">
            <span className="home-stat-number">{allInterviews.length}</span>
            <span className="home-stat-label">Total Simulated Sessions</span>
          </div>
        </div>

        <div className="home-stat-card glass-card">
          <div className="stat-icon-wrapper stat-green">
            <BsCheckCircleFill className="home-stat-icon" />
          </div>
          <div className="stat-content">
            <span className="home-stat-number">{completedCount}</span>
            <span className="home-stat-label">Verified Completions</span>
          </div>
        </div>

        <div className="home-stat-card glass-card">
          <div className="stat-icon-wrapper stat-purple">
            <BsTrophyFill className="home-stat-icon" />
          </div>
          <div className="stat-content">
            <span className="home-stat-number">{avgScore}%</span>
            <span className="home-stat-label">Average Performance Score</span>
          </div>
        </div>
      </div>

      {/* Recent Interviews Grid */}
      <div className="home-recent-section">
        <div className="home-section-header">
          <div>
            <h2 className="home-section-heading">Recent Mission Logs</h2>
            <p className="home-section-sub">Inspect past evaluations, replay recordings, and track rubric trends.</p>
          </div>
          {recentInterviews.length > 0 && (
            <button
              className="home-view-all-btn"
              onClick={() => navigate('/history')}
            >
              <span>Full Archive</span>
              <BsArrowRight />
            </button>
          )}
        </div>

        {loading ? (
          <div className="home-loading-state glass-card">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="home-loading-text">Synchronizing flight deck telemetry...</p>
          </div>
        ) : recentInterviews.length === 0 ? (
          <div className="home-empty-state glass-card">
            <BsChatSquareText className="home-empty-icon" />
            <h3 className="home-empty-heading">No interview telemetry on record</h3>
            <p className="home-empty-text">
              Launch your first mock interview to unlock full rubric analytics, STAR evaluations, and code execution scoring.
            </p>
            <button
              className="btn-glow-primary home-empty-cta-btn"
              onClick={() => navigate('/setup')}
            >
              <BsPlayCircleFill className="home-start-icon" />
              <span>Launch First Simulation</span>
            </button>
          </div>
        ) : (
          <div className="home-interviews-grid">
            {recentInterviews.map((interview) => (
              <InterviewCard
                key={interview._id}
                interview={interview}
                onClick={() => handleCardClick(interview)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
