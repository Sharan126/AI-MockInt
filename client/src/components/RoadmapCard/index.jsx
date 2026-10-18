import React, { useState, useEffect } from 'react';
import { FiClock, FiCalendar, FiEdit3, FiSave, FiX, FiCheckCircle } from 'react-icons/fi';
import { BsBullseye, BsLightningChargeFill, BsFire } from 'react-icons/bs';
import { updateGoal } from '../../services/interviewService.js';
import './index.css';

const DEFAULT_SPRINTS = [
  { id: 1, title: 'Master Distributed Caching (Redis/Memcached)', done: true },
  { id: 2, title: 'Formulate 4 High-Impact STAR Stories', done: true },
  { id: 3, title: 'Practice 2 Live Coding Sessions with Timer', done: false },
  { id: 4, title: 'Pass 1 Bar-Raiser Pressure Simulation', done: false },
];

const RoadmapCard = ({ user, onGoalUpdated }) => {
  const [targetCompany, setTargetCompany] = useState(
    user?.targetGoal?.targetCompany || 'Google'
  );
  const [targetRole, setTargetRole] = useState(
    user?.targetGoal?.targetRole || 'Full Stack Engineer'
  );
  const [targetDate, setTargetDate] = useState(
    user?.targetGoal?.targetDate
      ? new Date(user.targetGoal.targetDate).toISOString().split('T')[0]
      : new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [prepStreak, setPrepStreak] = useState(user?.targetGoal?.prepStreak || 3);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sprints, setSprints] = useState(DEFAULT_SPRINTS);

  // Time remaining calculation
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const targetTime = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, targetTime - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft({ days, hours, mins });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateGoal({
        targetCompany,
        targetRole,
        targetDate: new Date(targetDate),
        prepStreak,
      });
      setIsEditing(false);
      if (onGoalUpdated) onGoalUpdated(updated);
    } catch (err) {
      console.error('Failed to update goal:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSprint = (id) => {
    setSprints((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  const completedCount = sprints.filter((s) => s.done).length;
  const progressPercent = Math.round((completedCount / sprints.length) * 100);

  return (
    <div className="roadmap-card">
      <div className="roadmap-header">
        <div className="roadmap-title-group">
          <div className="roadmap-icon-badge">
            <BsBullseye className="roadmap-icon" />
          </div>
          <div>
            <h3 className="roadmap-title">Sprint Countdown & Study Roadmap</h3>
            <p className="roadmap-subtitle">
              Personalized path to crack {targetCompany} as {targetRole}
            </p>
          </div>
        </div>

        <div className="roadmap-actions">
          <div className="streak-badge" title="Daily Prep Activity Streak">
            <BsFire className="streak-icon" />
            <span>{prepStreak} Day Streak</span>
          </div>
          {!isEditing && (
            <button
              className="btn-edit-goal"
              onClick={() => setIsEditing(true)}
              title="Edit Target Goal"
            >
              <FiEdit3 /> Edit Goal
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <form className="goal-edit-form" onSubmit={handleSaveGoal}>
          <div className="goal-form-grid">
            <div className="form-group">
              <label>Target Company</label>
              <input
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. Google, Meta, Stripe"
                required
              />
            </div>
            <div className="form-group">
              <label>Target Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                required
              />
            </div>
            <div className="form-group">
              <label>Target Interview Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="goal-form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setIsEditing(false)}
            >
              <FiX /> Cancel
            </button>
            <button type="submit" className="btn-save" disabled={saving}>
              <FiSave /> {saving ? 'Saving...' : 'Save Goal'}
            </button>
          </div>
        </form>
      ) : (
        <div className="roadmap-body">
          {/* Countdown Clock */}
          <div className="countdown-container">
            <div className="countdown-label">
              <FiClock /> Interview Countdown
            </div>
            <div className="countdown-grid">
              <div className="countdown-unit">
                <span className="unit-number">{timeLeft.days}</span>
                <span className="unit-label">Days</span>
              </div>
              <span className="countdown-colon">:</span>
              <div className="countdown-unit">
                <span className="unit-number">{timeLeft.hours}</span>
                <span className="unit-label">Hours</span>
              </div>
              <span className="countdown-colon">:</span>
              <div className="countdown-unit">
                <span className="unit-number">{timeLeft.mins}</span>
                <span className="unit-label">Mins</span>
              </div>
            </div>
            <div className="target-date-display">
              <FiCalendar /> D-Day: {new Date(targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          {/* Sprint Milestones */}
          <div className="sprints-container">
            <div className="sprints-header">
              <div className="sprint-progress-title">
                <BsLightningChargeFill className="sprint-flash" />
                <span>Sprint Readiness ({progressPercent}%)</span>
              </div>
              <span className="sprint-ratio">{completedCount}/{sprints.length} complete</span>
            </div>

            <div className="sprint-progress-bar">
              <div
                className="sprint-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="sprint-list">
              {sprints.map((sprint) => (
                <div
                  key={sprint.id}
                  className={`sprint-item ${sprint.done ? 'done' : ''}`}
                  onClick={() => toggleSprint(sprint.id)}
                >
                  <FiCheckCircle className="sprint-check" />
                  <span className="sprint-text">{sprint.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapCard;
