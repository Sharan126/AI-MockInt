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
} from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';

function HomePage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [allInterviews, setAllInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getHistory();
        const list = Array.isArray(data) ? data : data?.interviews || [];
        setAllInterviews(list);
        setRecentInterviews(list.slice(0, 5));
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
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

  return (
    <div className="home-page">
      <div className="home-welcome">
        <h1 className="home-welcome-heading">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="home-welcome-subtitle">
          Practice makes perfect. Start a mock interview and get AI-powered
          feedback.
        </p>
      </div>

      {/* Executive Interview Readiness Gauge */}
      <div className="home-readiness-card shadow-sm">
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
                    ? '#2563eb'
                    : avgScore > 0
                    ? '#f59e0b'
                    : '#94a3b8',
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
              color:
                avgScore >= 85
                  ? '#10b981'
                  : avgScore >= 70
                  ? '#2563eb'
                  : avgScore > 0
                  ? '#f59e0b'
                  : '#64748b',
              borderColor:
                avgScore >= 85
                  ? '#10b981'
                  : avgScore >= 70
                  ? '#2563eb'
                  : avgScore > 0
                  ? '#f59e0b'
                  : '#cbd5e1',
            }}
          >
            {completedCount === 0
              ? 'New Candidate'
              : avgScore >= 85
              ? 'FAANG / Tier-1 Ready 🚀'
              : avgScore >= 70
              ? 'Strong Candidate ✨'
              : 'Skill Building Phase 📚'}
          </div>
          <h2 className="readiness-title">Interview Readiness Index</h2>
          <p className="readiness-desc">
            {completedCount > 0
              ? `Derived from your last ${completedCount} completed session${completedCount > 1 ? 's' : ''}. Practice structured STAR responses and code problem-solving to level up.`
              : 'Complete your first mock interview to unlock your personalized AI competency evaluation and FAANG readiness gauge.'}
          </p>
        </div>

        <div className="readiness-action-col">
          <button
            className="home-start-btn"
            onClick={() => navigate('/setup')}
          >
            <BsPlayCircleFill className="home-start-icon" />
            Start Mock Interview
          </button>
        </div>
      </div>

      <RoadmapCard user={user} />

      <div className="home-stats-row">
        <div className="home-stat-card shadow-sm">
          <BsChatSquareTextFill className="home-stat-icon" />
          <span className="home-stat-number">{allInterviews.length}</span>
          <span className="home-stat-label">Total Sessions</span>
        </div>
        <div className="home-stat-card shadow-sm">
          <BsCheckCircleFill className="home-stat-icon" />
          <span className="home-stat-number">{completedCount}</span>
          <span className="home-stat-label">Completed</span>
        </div>
        <div className="home-stat-card shadow-sm">
          <BsTrophyFill className="home-stat-icon" />
          <span className="home-stat-number">{avgScore}</span>
          <span className="home-stat-label">Average Score</span>
        </div>
      </div>

      <div className="home-recent-section">
        <div className="home-section-header">
          <h2 className="home-section-heading">Recent Interviews</h2>
          {recentInterviews.length > 0 && (
            <button
              className="home-view-all-btn"
              onClick={() => navigate('/history')}
            >
              View All
            </button>
          )}
        </div>

        {loading ? (
          <div className="home-loading-state">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="home-loading-text">Loading interviews...</p>
          </div>
        ) : recentInterviews.length === 0 ? (
          <div className="home-empty-state">
            <BsChatSquareText className="home-empty-icon" />
            <h3 className="home-empty-heading">No interviews yet</h3>
            <p className="home-empty-text">
              Start your first mock interview to see it here.
            </p>
            <button
              className="home-empty-cta-btn"
              onClick={() => navigate('/setup')}
            >
              <BsPlayCircleFill className="home-start-icon" />
              Start Interview
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
