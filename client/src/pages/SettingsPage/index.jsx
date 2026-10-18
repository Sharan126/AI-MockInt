import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { getMe, updateProfile, changePassword } from '../../services/authService.js';
import { clearHistory, getHistory } from '../../services/historyService.js';
import {
  MdPerson,
  MdTune,
  MdLock,
  MdDeleteSweep,
  MdFileDownload,
  MdCheckCircle,
} from 'react-icons/md';
import { BsShieldCheck, BsGoogle, BsGithub } from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';

const ROLES = [
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'DevOps Engineer',
  'AI / ML Engineer',
  'Mobile Developer (React Native / Flutter)',
];

const DIFFICULTIES = [
  { id: 'easy', label: 'Beginner / Junior' },
  { id: 'medium', label: 'Intermediate / Mid-Level' },
  { id: 'hard', label: 'Senior / Advanced' },
];

const CODE_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
];

function SettingsPage() {
  const { user, login } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('preferences');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile & Preferences state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [authProvider, setAuthProvider] = useState('local');
  const [preferredRole, setPreferredRole] = useState('Full Stack Developer');
  const [difficulty, setDifficulty] = useState('medium');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [voiceSpeed, setVoiceSpeed] = useState('normal');

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const profile = await getMe();
        if (profile) {
          setName(profile.name || '');
          setEmail(profile.email || '');
          setAuthProvider(profile.authProvider || 'local');
          if (profile.preferences) {
            setPreferredRole(profile.preferences.preferredRole || 'Full Stack Developer');
            setDifficulty(profile.preferences.difficulty || 'medium');
            setCodeLanguage(profile.preferences.codeLanguage || 'javascript');
            setVoiceSpeed(profile.preferences.voiceSpeed || 'normal');
          }
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProfile({
        name,
        preferences: {
          preferredRole,
          difficulty,
          codeLanguage,
          voiceSpeed,
        },
      });

      // Update current auth user in context
      const token = localStorage.getItem('token');
      if (token) {
        login(token, {
          ...user,
          name: updated.name,
        });
      }

      toast.success('Settings and preferences saved!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update settings';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setChangingPass(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password';
      toast.error(msg);
    } finally {
      setChangingPass(false);
    }
  };

  const handleClearAllHistory = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete all interview history? Your past scores and feedback will be permanently removed.'
      )
    ) {
      return;
    }
    try {
      await clearHistory();
      toast.success('Interview history successfully cleared');
    } catch {
      toast.error('Failed to clear history');
    }
  };

  const handleExportData = async () => {
    try {
      const historyData = await getHistory(1, 100);
      const dataStr =
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(historyData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `interview_performance_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Performance data exported!');
    } catch {
      toast.error('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="spinner-border spinner-border-sm" role="status" />
        <p>Loading your settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* Header */}
        <div className="settings-header">
          <h1 className="settings-title">Account & Interview Settings</h1>
          <p className="settings-subtitle">
            Customize your mock interview experience, preferred roles, and security options.
          </p>
        </div>

        {/* Layout Tabs */}
        <div className="settings-layout">
          <div className="settings-sidebar">
            <button
              className={`settings-nav-btn ${activeTab === 'preferences' ? 'settings-nav-active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              <MdTune className="nav-icon" />
              Interview Preferences
            </button>
            <button
              className={`settings-nav-btn ${activeTab === 'profile' ? 'settings-nav-active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <MdPerson className="nav-icon" />
              Profile Details
            </button>
            <button
              className={`settings-nav-btn ${activeTab === 'security' ? 'settings-nav-active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <MdLock className="nav-icon" />
              Security & Password
            </button>
            <button
              className={`settings-nav-btn ${activeTab === 'data' ? 'settings-nav-active' : ''}`}
              onClick={() => setActiveTab('data')}
            >
              <MdDeleteSweep className="nav-icon" />
              Data & History
            </button>
          </div>

          <div className="settings-content-card">
            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <form onSubmit={handleSavePreferences} className="settings-form">
                <h2 className="section-title">Interview Configuration</h2>
                <p className="section-desc">
                  Set default parameters so you can jump into practice interviews quickly.
                </p>

                <div className="settings-field">
                  <label htmlFor="pref-role" className="field-label">
                    Default Target Role
                  </label>
                  <select
                    id="pref-role"
                    className="field-select"
                    value={preferredRole}
                    onChange={(e) => setPreferredRole(e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="settings-field">
                  <label htmlFor="pref-diff" className="field-label">
                    Default Difficulty Level
                  </label>
                  <select
                    id="pref-diff"
                    className="field-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="settings-field">
                  <label htmlFor="pref-lang" className="field-label">
                    Default Code Editor Language
                  </label>
                  <select
                    id="pref-lang"
                    className="field-select"
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                  >
                    {CODE_LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="settings-field">
                  <label htmlFor="pref-speed" className="field-label">
                    Interviewer Voice Pace
                  </label>
                  <select
                    id="pref-speed"
                    className="field-select"
                    value={voiceSpeed}
                    onChange={(e) => setVoiceSpeed(e.target.value)}
                  >
                    <option value="normal">Normal (Standard Interview Pace)</option>
                    <option value="relaxed">Relaxed / Thoughtful</option>
                    <option value="fast">Brisk / Fast-Paced</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className={`settings-save-btn ${saving ? 'settings-btn-disabled' : ''}`}
                  disabled={saving}
                >
                  <MdCheckCircle /> {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </form>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSavePreferences} className="settings-form">
                <h2 className="section-title">Profile Information</h2>
                <p className="section-desc">Manage how your name appears across evaluations.</p>

                <div className="settings-field">
                  <label htmlFor="profile-name" className="field-label">
                    Full Name
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    className="field-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="profile-email" className="field-label">
                    Email Address
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    className="field-input field-input-readonly"
                    value={email}
                    disabled
                  />
                  <small className="field-hint">Email address cannot be changed.</small>
                </div>

                <div className="settings-field">
                  <label className="field-label">Sign-In Method</label>
                  <div className="auth-provider-chip">
                    {authProvider === 'google' ? (
                      <>
                        <BsGoogle className="chip-icon google-color" /> Google Account
                      </>
                    ) : authProvider === 'github' ? (
                      <>
                        <BsGithub className="chip-icon" /> GitHub Account
                      </>
                    ) : (
                      <>
                        <BsShieldCheck className="chip-icon local-color" /> Email & Password
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className={`settings-save-btn ${saving ? 'settings-btn-disabled' : ''}`}
                  disabled={saving}
                >
                  <MdCheckCircle /> {saving ? 'Saving...' : 'Update Profile'}
                </button>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="settings-form">
                <h2 className="section-title">Change Password</h2>
                <p className="section-desc">Ensure your account is protected with a secure password.</p>

                {authProvider !== 'local' ? (
                  <div className="oauth-security-note">
                    <BsShieldCheck className="note-icon" />
                    <div>
                      <h4>Managed by {authProvider === 'google' ? 'Google' : 'GitHub'}</h4>
                      <p>
                        Your account is authenticated via your {authProvider} account. You do
                        not need a separate password.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword}>
                    <div className="settings-field">
                      <label htmlFor="curr-pass" className="field-label">
                        Current Password
                      </label>
                      <input
                        id="curr-pass"
                        type="password"
                        className="field-input"
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="settings-field">
                      <label htmlFor="new-pass" className="field-label">
                        New Password
                      </label>
                      <input
                        id="new-pass"
                        type="password"
                        className="field-input"
                        placeholder="Min. 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="settings-field">
                      <label htmlFor="confirm-pass" className="field-label">
                        Confirm New Password
                      </label>
                      <input
                        id="confirm-pass"
                        type="password"
                        className="field-input"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>

                    <button
                      type="submit"
                      className={`settings-save-btn ${changingPass ? 'settings-btn-disabled' : ''}`}
                      disabled={changingPass}
                    >
                      {changingPass ? 'Updating...' : 'Change Password'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Data & History Tab */}
            {activeTab === 'data' && (
              <div className="settings-form">
                <h2 className="section-title">Interview Data & Exports</h2>
                <p className="section-desc">
                  Download a copy of your performance metrics or reset your interview history.
                </p>

                <div className="data-action-card">
                  <div>
                    <h3 className="data-card-title">Export Performance Data</h3>
                    <p className="data-card-desc">
                      Download a JSON file containing all your interview scores, category
                      evaluations, and AI feedback reports.
                    </p>
                  </div>
                  <button type="button" className="data-export-btn" onClick={handleExportData}>
                    <MdFileDownload /> Export Data
                  </button>
                </div>

                <div className="data-action-card danger-card">
                  <div>
                    <h3 className="data-card-title text-danger">Clear All History</h3>
                    <p className="data-card-desc">
                      Permanently remove all completed and in-progress interview records. This
                      resets your performance progression metrics.
                    </p>
                  </div>
                  <button type="button" className="data-clear-btn" onClick={handleClearAllHistory}>
                    <MdDeleteSweep /> Clear History
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
