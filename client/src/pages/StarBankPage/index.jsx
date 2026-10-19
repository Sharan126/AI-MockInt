import { useState, useEffect } from 'react';
import {
  getStarStories,
  saveStarStory,
  deleteStarStory,
  auditStarStory,
} from '../../services/interviewService.js';
import {
  BsStarFill,
  BsPlusLg,
  BsTrash,
  BsPencilSquare,
  BsCheckCircleFill,
  BsExclamationCircleFill,
  BsLightbulbFill,
  BsClipboardCheck,
  BsSearch,
  BsBuilding,
  BsShieldCheck,
  BsCpu,
} from 'react-icons/bs';
import { FiCopy, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './index.css';

const CATEGORIES = [
  'All',
  'Technical Leadership',
  'Conflict & Disagreement',
  'High-Scale Outage & Crisis',
  'Failure & Lessons Learned',
  'Customer Obsession & Impact',
];

const STAR_TEMPLATES = [
  {
    title: 'Distributed Cache Migration Under 25k QPS',
    category: 'Technical Leadership',
    situation: 'At our previous company, the primary Postgres database suffered p99 query latency spikes exceeding 1.8s during peak marketing flash sales due to un-cached product catalog scans.',
    task: 'As the technical lead for the catalog squad, I was tasked with architecting a zero-downtime distributed caching layer to absorb 80% of read traffic without serving stale pricing.',
    action: 'I designed a dual-read Redis cluster with cache-aside invalidation triggered by Debezium CDC events. I wrote synthetic load-testing harnesses to simulate 25k QPS before traffic cutover.',
    result: 'Reduced database CPU utilization from 94% to 28%, dropped p99 read latency by 72% (from 1.8s to 45ms), and maintained 99.99% cache hit ratio with zero stale-pricing incidents.',
  },
  {
    title: 'Resolving Architectural Disagreement on Event Bus',
    category: 'Conflict & Disagreement',
    situation: 'Our data engineering and backend teams were locked in an architectural deadlock regarding whether to adopt Apache Kafka or AWS SQS for our async order pipeline.',
    task: 'I needed to align both engineering leads to prevent a 3-week project delay while ensuring the infrastructure met multi-region replication requirements.',
    action: 'Rather than debating theoretical pros and cons, I facilitated a time-boxed 2-day spike measuring operational maintenance overhead, payload size limits, and replay capabilities under failover.',
    result: 'The empirical data demonstrated that Managed Kafka saved 40 hours of monthly operational patching. Both leads signed off on the RFC within 48 hours, delivering the project 1 week ahead of schedule.',
  },
];

function StarBankPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing / Creating State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Technical Leadership',
    situation: '',
    task: '',
    action: '',
    result: '',
  });

  // AI Audit State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const data = await getStarStories();
      if (data && data.length > 0) {
        setStories(data);
      } else {
        // Pre-populate with starter templates if empty
        setStories(STAR_TEMPLATES.map((t, i) => ({ id: `starter-${i}`, ...t })));
      }
    } catch (err) {
      toast.error('Failed to load STAR stories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (story = null) => {
    if (story) {
      setEditingId(story.id);
      setFormData({
        title: story.title || '',
        category: story.category || 'Technical Leadership',
        situation: story.situation || '',
        task: story.task || '',
        action: story.action || '',
        result: story.result || '',
      });
      setAuditResult(story.audit || null);
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        category: 'Technical Leadership',
        situation: '',
        task: '',
        action: '',
        result: '',
      });
      setAuditResult(null);
    }
    setIsModalOpen(true);
  };

  const handleRunAudit = async () => {
    if (!formData.situation || !formData.action || !formData.result) {
      toast.error('Please fill out at least Situation, Action, and Result to audit.');
      return;
    }

    setIsAuditing(true);
    try {
      const result = await auditStarStory(formData);
      setAuditResult(result);
      toast.success('STAR completeness audit finished!');
    } catch (err) {
      toast.error('Audit failed, please try again.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a title for your story.');
      return;
    }

    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        ...formData,
        audit: auditResult,
      };
      const updatedList = await saveStarStory(payload);
      setStories(updatedList);
      setIsModalOpen(false);
      toast.success(editingId ? 'Story updated!' : 'STAR story added to vault!');
    } catch (err) {
      toast.error('Failed to save story');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this STAR story from your vault?')) return;

    try {
      const updated = await deleteStarStory(id);
      setStories(updated);
      toast.success('Story deleted');
    } catch (err) {
      toast.error('Failed to delete story');
    }
  };

  const handleCopy = (story, e) => {
    e.stopPropagation();
    const formatted = `TITLE: ${story.title}\nCATEGORY: ${story.category}\n\n[SITUATION]\n${story.situation}\n\n[TASK]\n${story.task}\n\n[ACTION]\n${story.action}\n\n[RESULT]\n${story.result}`;
    navigator.clipboard.writeText(formatted);
    setCopiedId(story.id);
    toast.success('Formatted STAR story copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredStories = stories.filter((s) => {
    const matchesCategory =
      selectedCategory === 'All' || s.category === selectedCategory;
    const matchesQuery =
      (s.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.situation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.action || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="star-bank-page">
      <div className="star-bank-container">
        {/* Header */}
        <div className="star-bank-header">
          <div>
            <div className="star-badge-row">
              <span className="star-top-badge">
                <BsStarFill className="star-icon-inline" /> BEHAVIORAL REPERTOIRE VAULT
              </span>
            </div>
            <h1 className="star-bank-title">STAR Story Bank & AI Coach</h1>
            <p className="star-bank-subtitle">
              Draft, audit, and calibrate your flagship behavioral stories using the FAANG-standard STAR methodology (Situation, Task, Action, Result).
            </p>
          </div>

          <button
            type="button"
            className="create-story-btn"
            onClick={() => handleOpenModal()}
          >
            <BsPlusLg /> Craft New STAR Story
          </button>
        </div>

        {/* Search & Categories Bar */}
        <div className="star-filter-bar">
          <div className="star-search-box">
            <BsSearch className="star-search-icon" />
            <input
              type="text"
              placeholder="Search stories by keyword, metric, or architecture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="star-search-input"
            />
          </div>

          <div className="star-category-chips">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Stories Grid */}
        {loading ? (
          <div className="star-loading-view">
            <div className="spinner-border spinner-border-sm" role="status" />
            <p>Loading your story repertoire...</p>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="star-empty-view">
            <BsStarFill className="star-empty-icon" />
            <h3>No stories match your filter</h3>
            <p>Craft your first behavioral STAR story or choose another category.</p>
            <button
              type="button"
              className="create-story-btn"
              onClick={() => handleOpenModal()}
            >
              <BsPlusLg /> Add Story
            </button>
          </div>
        ) : (
          <div className="stories-grid">
            {filteredStories.map((story) => {
              const auditScore = story.audit?.starScore || 85;
              return (
                <div
                  key={story.id}
                  className="story-card"
                  onClick={() => handleOpenModal(story)}
                >
                  <div className="story-card-top">
                    <span className="story-cat-badge">{story.category}</span>
                    <div className="story-actions-group">
                      <button
                        type="button"
                        className="story-action-btn"
                        title="Copy STAR Script"
                        onClick={(e) => handleCopy(story, e)}
                      >
                        {copiedId === story.id ? (
                          <FiCheck className="text-success" />
                        ) : (
                          <FiCopy />
                        )}
                      </button>
                      <button
                        type="button"
                        className="story-action-btn delete-btn"
                        title="Delete Story"
                        onClick={(e) => handleDelete(story.id, e)}
                      >
                        <BsTrash />
                      </button>
                    </div>
                  </div>

                  <h3 className="story-card-title">{story.title}</h3>

                  <div className="star-sections-preview">
                    <div className="star-preview-block">
                      <span className="star-letter s">S</span>
                      <p className="star-preview-text">{story.situation}</p>
                    </div>
                    <div className="star-preview-block">
                      <span className="star-letter t">T</span>
                      <p className="star-preview-text">{story.task}</p>
                    </div>
                    <div className="star-preview-block">
                      <span className="star-letter a">A</span>
                      <p className="star-preview-text">{story.action}</p>
                    </div>
                    <div className="star-preview-block">
                      <span className="star-letter r">R</span>
                      <p className="star-preview-text result-highlight">
                        {story.result}
                      </p>
                    </div>
                  </div>

                  <div className="story-card-footer">
                    <span className="star-score-badge">
                      Audit Score: <strong>{auditScore}%</strong>
                    </span>
                    <span className="edit-link-hint">
                      <BsPencilSquare /> Edit & Audit
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Craft / Edit Story Modal */}
        {isModalOpen && (
          <div className="star-modal-backdrop" onClick={() => setIsModalOpen(false)}>
            <div
              className="star-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="star-modal-header">
                <div>
                  <h2 className="modal-title">
                    {editingId ? 'Edit STAR Story' : 'Craft Flagship STAR Story'}
                  </h2>
                  <p className="modal-sub">
                    Calibrate your story structure for maximum executive impact.
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="star-form">
                <div className="form-row-grid">
                  <div className="form-group">
                    <label className="form-label">Story Headline</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Scaling Auth Service to 50k RPS During Black Friday"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    >
                      {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* S - Situation */}
                <div className="form-group">
                  <label className="form-label star-label-s">
                    <span className="star-badge-letter">S</span> Situation (Context, scale, and stakes)
                  </label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="Where were you? What was the production system or team challenge? What was the business impact if unaddressed?"
                    value={formData.situation}
                    onChange={(e) =>
                      setFormData({ ...formData, situation: e.target.value })
                    }
                  />
                </div>

                {/* T - Task */}
                <div className="form-group">
                  <label className="form-label star-label-t">
                    <span className="star-badge-letter">T</span> Task (Your specific ownership & goal)
                  </label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="What was your individual role and deliverable? What constraints or deadlines were you navigating?"
                    value={formData.task}
                    onChange={(e) =>
                      setFormData({ ...formData, task: e.target.value })
                    }
                  />
                </div>

                {/* A - Action */}
                <div className="form-group">
                  <label className="form-label star-label-a">
                    <span className="star-badge-letter">A</span> Action (Specific technical decisions & leadership moves)
                  </label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="What specific tools, architectural patterns, or compromises did YOU implement? Use active verbs ('I architected', 'I profiled')."
                    value={formData.action}
                    onChange={(e) =>
                      setFormData({ ...formData, action: e.target.value })
                    }
                  />
                </div>

                {/* R - Result */}
                <div className="form-group">
                  <label className="form-label star-label-r">
                    <span className="star-badge-letter">R</span> Result (Quantified metric, % improvement, long-term impact)
                  </label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="What happened? Always quantify! e.g., 'Reduced p99 latency by 45%, saving $120k annually in cloud egress.'"
                    value={formData.result}
                    onChange={(e) =>
                      setFormData({ ...formData, result: e.target.value })
                    }
                  />
                </div>

                {/* Live AI Audit Section */}
                <div className="modal-audit-bar">
                  <button
                    type="button"
                    className="run-audit-btn"
                    onClick={handleRunAudit}
                    disabled={isAuditing}
                  >
                    <BsLightbulbFill />
                    {isAuditing ? 'Auditing with Gemini AI...' : 'Run AI STAR Completeness Audit'}
                  </button>
                </div>

                {auditResult && (
                  <div className="audit-results-card">
                    <div className="audit-card-top">
                      <span className="audit-score-pill">
                        Completeness Score: <strong>{auditResult.starScore}/100</strong>
                      </span>
                      {auditResult.executiveTip && (
                        <span className="audit-exec-tip">
                          💡 <strong>Executive Tip:</strong> {auditResult.executiveTip}
                        </span>
                      )}
                    </div>

                    <div className="audit-feedback-grid">
                      <div className="audit-feedback-item">
                        <strong>Situation:</strong> {auditResult.situationFeedback}
                      </div>
                      <div className="audit-feedback-item">
                        <strong>Task:</strong> {auditResult.taskFeedback}
                      </div>
                      <div className="audit-feedback-item">
                        <strong>Action:</strong> {auditResult.actionFeedback}
                      </div>
                      <div className="audit-feedback-item">
                        <strong>Result:</strong> {auditResult.resultFeedback}
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="modal-footer-actions">
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="modal-submit-btn">
                    {editingId ? 'Save Changes' : 'Save Story to Vault'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StarBankPage;
