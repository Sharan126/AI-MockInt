import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getHistory,
  deleteHistoryItem,
  clearHistory,
} from '../../services/historyService.js';
import InterviewCard from '../../components/InterviewCard';
import {
  MdDeleteSweep,
  MdTrendingUp,
  MdTrendingDown,
  MdStars,
  MdBarChart,
  MdSpeed,
} from 'react-icons/md';
import { BsClipboardData, BsLightningChargeFill } from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';

function HistoryPage() {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'in_progress'

  const ITEMS_PER_PAGE = 8;

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getHistory(page, ITEMS_PER_PAGE);
      if (data) {
        setInterviews(data.interviews || []);
        setTotalPages(data.totalPages || 1);
        setTotalEntries(data.total || 0);
        if (data.analytics) {
          setAnalytics(data.analytics);
        }
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      toast.error('Could not load interview history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this interview record?')) {
      return;
    }
    try {
      const res = await deleteHistoryItem(id);
      if (res.success !== false) {
        toast.success('Interview deleted');
        fetchHistory();
      } else {
        toast.error('Could not delete interview');
      }
    } catch {
      toast.error('Failed to delete interview');
    }
  };

  const handleClearAll = async () => {
    if (
      !window.confirm(
        'Are you sure you want to clear your entire interview history? This action cannot be undone.'
      )
    ) {
      return;
    }
    try {
      await clearHistory();
      toast.success('All interview history cleared');
      setInterviews([]);
      setTotalEntries(0);
      setAnalytics(null);
    } catch {
      toast.error('Failed to clear history');
    }
  };

  const handleCardClick = (interview) => {
    if (interview.status === 'completed') {
      navigate(`/feedback/${interview._id}`);
    } else {
      navigate(`/interview/${interview._id}`);
    }
  };

  // Filter interviews on the client
  const filteredInterviews = interviews.filter((item) => {
    if (filter === 'completed') return item.status === 'completed';
    if (filter === 'in_progress') return item.status === 'in_progress';
    return true;
  });

  return (
    <div className="history-page">
      <div className="history-container">
        {/* Header */}
        <div className="history-header-row">
          <div className="history-header-left">
            <h1 className="history-heading">Interview History & Performance</h1>
            <span className="history-count-badge">
              {totalEntries} Total Session{totalEntries !== 1 ? 's' : ''}
            </span>
          </div>
          {interviews.length > 0 && (
            <button className="history-clear-btn" onClick={handleClearAll}>
              <MdDeleteSweep className="history-clear-icon" />
              Clear All
            </button>
          )}
        </div>

        {/* Continuous Performance Comparison Section */}
        {analytics && analytics.totalCompleted > 0 && (
          <div className="performance-comparison-panel">
            <div className="comparison-header">
              <div className="comparison-title-wrap">
                <MdBarChart className="comparison-icon" />
                <div>
                  <h2 className="comparison-title">Continuous Performance Tracker</h2>
                  <p className="comparison-subtitle">
                    Compare your interview mastery level and track your growth over time.
                  </p>
                </div>
              </div>
              <div className="level-badge-pill">
                <MdStars className="level-icon" />
                <span>Level: <strong>{analytics.performanceLevel}</strong></span>
              </div>
            </div>

            <div className="comparison-metrics-grid">
              <div className="metric-box">
                <span className="metric-label">Average Score</span>
                <span className="metric-val">{analytics.averageScore}/100</span>
                <span className="metric-hint">Across {analytics.totalCompleted} interview{analytics.totalCompleted !== 1 ? 's' : ''}</span>
              </div>

              <div className="metric-box">
                <span className="metric-label">Best Score</span>
                <span className="metric-val best-score">{analytics.highestScore}/100</span>
                <span className="metric-hint">Peak performance achieved</span>
              </div>

              <div className="metric-box">
                <span className="metric-label">Latest Momentum</span>
                <div className="momentum-row">
                  {analytics.scoreProgression >= 0 ? (
                    <span className="progression-pos">
                      <MdTrendingUp /> +{analytics.scoreProgression} pts
                    </span>
                  ) : (
                    <span className="progression-neg">
                      <MdTrendingDown /> {analytics.scoreProgression} pts
                    </span>
                  )}
                </div>
                <span className="metric-hint">Compared to previous session</span>
              </div>

              <div className="metric-box">
                <span className="metric-label">Ready Status</span>
                <span className="metric-val ready-val">
                  {analytics.averageScore >= 80 ? 'Interview Ready' : analytics.averageScore >= 65 ? 'Competitive' : 'Practicing'}
                </span>
                <span className="metric-hint">Based on AI evaluation rubric</span>
              </div>
            </div>

            {/* Visual Level Progression Timeline */}
            {analytics.scoreHistory && analytics.scoreHistory.length > 1 && (
              <div className="score-trend-timeline">
                <h3 className="trend-title">
                  <BsLightningChargeFill className="trend-icon" /> Score Progression by Session
                </h3>
                <div className="trend-bars-row">
                  {analytics.scoreHistory.map((item, idx) => {
                    const heightPercent = Math.max(15, Math.min(100, item.score));
                    const isBest = item.score === analytics.highestScore;
                    return (
                      <div key={item.id || idx} className="trend-bar-col" onClick={() => navigate(`/feedback/${item.id}`)}>
                        <span className="trend-bar-score">{item.score}</span>
                        <div className="trend-bar-track">
                          <div
                            className={`trend-bar-fill ${isBest ? 'trend-bar-best' : ''}`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                        <span className="trend-bar-label">#{idx + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter Pills */}
        <div className="history-filter-row">
          <div className="history-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'filter-active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({interviews.length})
            </button>
            <button
              className={`filter-btn ${filter === 'completed' ? 'filter-active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed ({interviews.filter((i) => i.status === 'completed').length})
            </button>
            <button
              className={`filter-btn ${filter === 'in_progress' ? 'filter-active' : ''}`}
              onClick={() => setFilter('in_progress')}
            >
              In Progress ({interviews.filter((i) => i.status === 'in_progress').length})
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="history-loading-state">
            <div className="spinner-border spinner-border-sm" role="status" />
            <p className="history-loading-text">Loading interview records...</p>
          </div>
        ) : filteredInterviews.length === 0 ? (
          <div className="history-empty-state">
            <BsClipboardData className="history-empty-icon" />
            <h3 className="history-empty-heading">
              {filter === 'all' ? 'No interviews yet' : `No ${filter.replace('_', ' ')} interviews`}
            </h3>
            <p className="history-empty-desc">
              Take an interview to test your readiness and start comparing your score progression.
            </p>
            <button
              className="history-start-btn"
              onClick={() => navigate('/setup')}
            >
              Start New Interview
            </button>
          </div>
        ) : (
          <>
            <div className="history-grid">
              {filteredInterviews.map((interview) => (
                <InterviewCard
                  key={interview._id}
                  interview={interview}
                  onClick={() => handleCardClick(interview)}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="history-pagination">
                <button
                  className={`history-page-btn ${page === 1 ? 'history-page-btn-disabled' : ''}`}
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span className="history-page-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  className={`history-page-btn ${page === totalPages ? 'history-page-btn-disabled' : ''}`}
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;
