import { useState } from 'react';
import { simulateNegotiation } from '../../services/interviewService.js';
import {
  BsCashStack,
  BsLightningChargeFill,
  BsShieldCheck,
  BsArrowUpRight,
  BsBuilding,
  BsBriefcaseFill,
  BsGraphUpArrow,
  BsCheckCircleFill,
} from 'react-icons/bs';
import { FiCopy, FiCheck, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './index.css';

function SalaryNegotiatorPage() {
  const [formData, setFormData] = useState({
    role: 'Senior Software Engineer (L5)',
    company: 'Google',
    baseSalary: 185000,
    equity: 120000, // per year
    signOn: 30000,
    targetComp: 375000,
    competingOffers: 'Received a competitive offer from Databricks at $360,000 TC and active final rounds with Stripe.',
    candidateCounterProposal: 'I am excited about the team scope and would sign immediately if we can bridge total compensation to $375,000 through sign-on bonus or RSUs.',
  });

  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const currentTotal =
    Number(formData.baseSalary || 0) +
    Number(formData.equity || 0) +
    Number(formData.signOn || 0);

  const handleSimulate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await simulateNegotiation(formData);
      setSimulationResult(result);
      toast.success('AI Compensation negotiation simulated!');
    } catch (err) {
      toast.error('Simulation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = () => {
    if (!simulationResult?.recommendedCounterEmail) return;
    navigator.clipboard.writeText(simulationResult.recommendedCounterEmail);
    setCopiedEmail(true);
    toast.success('Counter-offer email copied to clipboard!');
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="negotiator-page">
      <div className="negotiator-container">
        {/* Header */}
        <div className="negotiator-header">
          <div className="negotiator-badge-row">
            <span className="negotiator-top-badge">
              <BsCashStack /> FAANG OFFER LEVERAGE LAB
            </span>
          </div>
          <h1 className="negotiator-title">
            AI Compensation Negotiation & Counter-Proposal Simulator
          </h1>
          <p className="negotiator-subtitle">
            Stress-test your counter-offer arguments against an AI VP of Compensation. Uncover negotiation leverage, forecast revised offer numbers, and generate field-tested counter emails.
          </p>
        </div>

        <div className="negotiator-main-layout">
          {/* Left Form: Offer Package & Counter Inputs */}
          <div className="negotiator-card form-card">
            <h2 className="card-heading">1. Initial Offer Package</h2>

            <form onSubmit={handleSimulate} className="offer-form">
              <div className="form-two-col">
                <div className="input-group">
                  <label className="input-label">Target Role</label>
                  <input
                    type="text"
                    className="text-input"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Company</label>
                  <input
                    type="text"
                    className="text-input"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-three-col">
                <div className="input-group">
                  <label className="input-label">Base Salary ($/yr)</label>
                  <input
                    type="number"
                    className="text-input"
                    value={formData.baseSalary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        baseSalary: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Annual Equity ($/yr)</label>
                  <input
                    type="number"
                    className="text-input"
                    value={formData.equity}
                    onChange={(e) =>
                      setFormData({ ...formData, equity: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Sign-On Bonus ($)</label>
                  <input
                    type="number"
                    className="text-input"
                    value={formData.signOn}
                    onChange={(e) =>
                      setFormData({ ...formData, signOn: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="offer-summary-strip">
                <span>Initial First-Year Total Comp:</span>
                <strong>${currentTotal.toLocaleString()}</strong>
              </div>

              <h2 className="card-heading" style={{ marginTop: '1rem' }}>
                2. Counter-Proposal & Leverage
              </h2>

              <div className="input-group">
                <label className="input-label">Desired Target TC ($/yr)</label>
                <input
                  type="number"
                  className="text-input"
                  value={formData.targetComp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetComp: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  Competing Offers & Leverage Levers
                </label>
                <textarea
                  rows={2}
                  className="textarea-input"
                  placeholder="e.g. Competing offer at Databricks ($360k TC), unique distributed systems expertise..."
                  value={formData.competingOffers}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      competingOffers: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-group">
                <label className="input-label">Your Counter-Offer Narrative</label>
                <textarea
                  rows={3}
                  className="textarea-input"
                  placeholder="How will you communicate your counter to the recruiter?"
                  value={formData.candidateCounterProposal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      candidateCounterProposal: e.target.value,
                    })
                  }
                />
              </div>

              <button
                type="submit"
                className="simulate-submit-btn"
                disabled={loading}
              >
                <BsLightningChargeFill />
                {loading
                  ? 'Simulating with AI Compensation Director...'
                  : 'Simulate Negotiation & Generate Counter Email'}
              </button>
            </form>
          </div>

          {/* Right Panel: Simulated Response & Strategy */}
          <div className="negotiator-card result-card">
            <h2 className="card-heading">3. Negotiation Simulation & Forecast</h2>

            {!simulationResult && !loading && (
              <div className="sim-placeholder-box">
                <BsGraphUpArrow className="sim-placeholder-icon" />
                <h3>Ready to Simulate</h3>
                <p>
                  Enter your offer details on the left and run the simulator to forecast the recruiter's counter and receive tactical guidance.
                </p>
              </div>
            )}

            {loading && (
              <div className="sim-placeholder-box">
                <div className="spinner-border text-primary" role="status" />
                <p>Modeling recruiter band constraints and leverage score...</p>
              </div>
            )}

            {simulationResult && !loading && (
              <div className="sim-results-feed">
                {/* Leverage Gauge & Revised TC */}
                <div className="leverage-banner">
                  <div className="leverage-score-col">
                    <span className="leverage-score-number">
                      {simulationResult.leverageScore || 82}%
                    </span>
                    <span className="leverage-score-label">Leverage Score</span>
                  </div>
                  <div className="revised-tc-col">
                    <span className="revised-tc-label">Forecasted Revised TC</span>
                    <span className="revised-tc-val">
                      ${Number(
                        simulationResult.revisedOffer?.totalComp ||
                          formData.targetComp - 8000
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Recruiter Simulated Reply */}
                <div className="recruiter-speech-box">
                  <div className="recruiter-speech-header">
                    <BsBuilding className="recruiter-icon" />
                    <strong>{formData.company} Compensation Committee Verdict:</strong>
                  </div>
                  <p className="recruiter-quote">
                    “{simulationResult.recruiterResponse}”
                  </p>
                </div>

                {/* Tactical Critique */}
                {simulationResult.tacticalCritique && (
                  <div className="tactical-critique-card">
                    <strong>🎯 Tactical Critique:</strong>
                    <p>{simulationResult.tacticalCritique}</p>
                  </div>
                )}

                {/* Generated Counter Email */}
                {simulationResult.recommendedCounterEmail && (
                  <div className="counter-email-card">
                    <div className="counter-email-header">
                      <strong>Recommended Counter-Offer Email:</strong>
                      <button
                        type="button"
                        className="copy-email-btn"
                        onClick={handleCopyEmail}
                      >
                        {copiedEmail ? <FiCheck /> : <FiCopy />}
                        <span>{copiedEmail ? 'Copied' : 'Copy Email'}</span>
                      </button>
                    </div>
                    <pre className="email-pre">
                      {simulationResult.recommendedCounterEmail}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalaryNegotiatorPage;
