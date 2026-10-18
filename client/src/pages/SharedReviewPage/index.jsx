import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiAward,
  FiCheckCircle,
  FiTrendingUp,
  FiAlertCircle,
  FiShare2,
  FiExternalLink,
} from 'react-icons/fi';
import { BsBullseye, BsDiagram3 } from 'react-icons/bs';
import { getSharedInterview } from '../../services/interviewService.js';
import GameFilmPlayer from '../../components/GameFilmPlayer/index.jsx';
import './index.css';

const SharedReviewPage = () => {
  const { token } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const data = await getSharedInterview(token);
        setInterview(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Shared interview link is invalid or expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchShared();
  }, [token]);

  if (loading) {
    return (
      <div className="shared-review-loading">
        <div className="shared-spinner" />
        <p>Loading shared interview review...</p>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="shared-review-error">
        <FiAlertCircle className="err-icon" />
        <h2>Interview Not Found</h2>
        <p>{error || 'This shared review link is no longer available.'}</p>
        <Link to="/" className="btn-back-home">
          Go to AI MockInt Home
        </Link>
      </div>
    );
  }

  const feedback = interview.feedback || {};
  const categories = feedback.categoryScores || {};

  return (
    <div className="shared-review-page">
      {/* Mentor Notice Banner */}
      <div className="shared-notice-banner">
        <div className="notice-left">
          <FiShare2 className="notice-icon" />
          <div>
            <strong>Mentor & Peer Review Mode</strong>
            <span>You are viewing a shared performance debrief for {interview.role} ({interview.companyTrack} Track).</span>
          </div>
        </div>
        <Link to="/interview/setup" className="btn-try-ai">
          Practice Your Own Interview <FiExternalLink />
        </Link>
      </div>

      {/* Hero Overview */}
      <div className="shared-hero-card">
        <div className="hero-info">
          <span className="track-tag">{interview.companyTrack} Track</span>
          <h1 className="hero-role-title">{interview.role}</h1>
          <p className="hero-meta">
            Evaluated by {interview.interviewerPersona || 'Natalie'} • {new Date(interview.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="hero-score-badge">
          <span className="score-big">{interview.overallScore || feedback.overallScore || 80}</span>
          <span className="score-label">Overall Score / 100</span>
        </div>
      </div>

      {/* Audio Game Film Replay */}
      {interview.messages && interview.messages.length > 0 && (
        <GameFilmPlayer
          messages={interview.messages}
          interviewerPersona={interview.interviewerPersona}
        />
      )}

      {/* Category Grid */}
      <div className="shared-categories-grid">
        {Object.entries(categories).map(([key, val]) => (
          <div key={key} className="category-card">
            <div className="cat-top">
              <span className="cat-name">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className="cat-score">{val.score || 80}%</span>
            </div>
            <div className="cat-progress">
              <div
                className="cat-progress-bar"
                style={{ width: `${val.score || 80}%` }}
              />
            </div>
            <p className="cat-comment">{val.comment}</p>
          </div>
        ))}
      </div>

      {/* Strengths & Improvements */}
      <div className="feedback-insights-grid">
        <div className="insight-card strengths">
          <h3>
            <FiCheckCircle className="ic-icon text-emerald" />
            Key Strengths Observed
          </h3>
          <ul>
            {feedback.strengths?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="insight-card improvements">
          <h3>
            <FiTrendingUp className="ic-icon text-amber" />
            Areas for Candidate Improvement
          </h3>
          <ul>
            {feedback.areasOfImprovement?.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* System Design Whiteboard Snapshot if candidate audited one */}
      {interview.whiteboardData && interview.whiteboardData.nodes && (
        <div className="whiteboard-snapshot-card">
          <div className="wb-snap-header">
            <BsDiagram3 className="wb-snap-icon" />
            <div>
              <h3>System Design Architecture Topology</h3>
              <p>{interview.whiteboardData.nodes.length} nodes & {interview.whiteboardData.connections?.length || 0} connections designed</p>
            </div>
          </div>
          <div className="wb-snap-tags">
            {interview.whiteboardData.nodes.map((n, i) => (
              <span key={i} className="wb-snap-node" style={{ borderColor: n.color }}>
                {n.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedReviewPage;
