import { MdDelete, MdArrowForward } from 'react-icons/md';
import getScoreColor from '../../constants/scoreColors.js';
import './index.css';

function InterviewCard({ interview, onClick, onDelete }) {
  const date = new Date(interview.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isCompleted = interview.status === 'completed';
  const statusClass = isCompleted ? 'badge-success' : 'badge-warning';
  const statusLabel = isCompleted ? 'Completed' : 'In Progress';

  const categoryScores = interview.feedback?.categoryScores;
  const assessment = interview.feedback?.finalAssessment;

  return (
    <div className="interview-card" onClick={onClick}>
      <div className="interview-card-top">
        <h3 className="interview-card-role">{interview.role}</h3>
        <span className={`interview-badge ${statusClass}`}>{statusLabel}</span>
      </div>

      <div className="interview-card-meta">
        <span className="interview-card-date">{date}</span>
        <span className="interview-card-questions">
          {interview.totalQuestions} questions
        </span>
      </div>

      {interview.overallScore !== null && interview.overallScore !== undefined && (
        <div className="interview-card-score-row">
          <div className="interview-card-score">
            <span
              className="score-value"
              style={{ color: getScoreColor(interview.overallScore) }}
            >
              {interview.overallScore}
            </span>
            <span className="score-label">/100</span>
          </div>

          {categoryScores && (
            <div className="card-mini-scores">
              {categoryScores.technicalKnowledge?.score !== undefined && (
                <span className="mini-score-chip" title="Technical Knowledge">
                  Tech: <strong>{categoryScores.technicalKnowledge.score}</strong>
                </span>
              )}
              {categoryScores.communicationSkills?.score !== undefined && (
                <span className="mini-score-chip" title="Communication Skills">
                  Comm: <strong>{categoryScores.communicationSkills.score}</strong>
                </span>
              )}
              {categoryScores.problemSolving?.score !== undefined && (
                <span className="mini-score-chip" title="Problem Solving">
                  Solve: <strong>{categoryScores.problemSolving.score}</strong>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {assessment && (
        <p className="card-brief-assessment">
          {assessment.length > 110 ? assessment.substring(0, 110) + '...' : assessment}
        </p>
      )}

      <div className="interview-card-footer">
        <span className="card-view-btn">
          {isCompleted ? 'View Results' : 'Resume'} <MdArrowForward className="view-btn-icon" />
        </span>
        <button
          className="interview-card-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(interview._id);
          }}
          title="Delete interview"
        >
          <MdDelete className="delete-icon" />
          Delete
        </button>
      </div>
    </div>
  );
}

export default InterviewCard;
