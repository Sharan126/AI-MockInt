import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  getInterview,
  submitTextAnswer,
  transcribeAudio,
  submitCode,
  endInterview,
} from '../../services/interviewService.js';
import VoiceRecorder from '../../components/VoiceRecorder';
import AudioPlayer from '../../components/AudioPlayer';
import CodeEditor from '../../components/CodeEditor';
import { FaUserTie } from 'react-icons/fa';
import {
  BsRecordCircleFill,
  BsKeyboardFill,
  BsCodeSlash,
  BsCheck,
  BsCheckCircleFill,
  BsXCircleFill,
} from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';

const STATE_SPEAKING = 'speaking';
const STATE_THINKING = 'thinking';
const STATE_LISTENING = 'listening';
const STATE_FAREWELL = 'farewell';

function InterviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ending, setEnding] = useState(false);

  const [interviewerState, setInterviewerState] = useState(STATE_SPEAKING);

  const [showTextFallback, setShowTextFallback] = useState(false);
  const [textAnswer, setTextAnswer] = useState('');

  const [code, setCode] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeEvaluation, setCodeEvaluation] = useState(null);

  const [currentAudio, setCurrentAudio] = useState(null);
  const [audioKey, setAudioKey] = useState(0);

  const [currentQuestionNum, setCurrentQuestionNum] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [interviewerText, setInterviewerText] = useState('');
  const [farewellMessage, setFarewellMessage] = useState('');

  useEffect(() => {
    const loadInterview = async () => {
      try {
        const data = await getInterview(id);
        if (data) {
          setCurrentQuestionNum(data.currentQuestion || 1);
          setTotalQuestions(data.totalQuestions || 5);
          const q =
            (data.questions && data.questions[data.currentQuestion - 1]) ||
            data.questions?.[0] ||
            null;
          setCurrentQuestion(q);
          const lastMsg = data.messages
            ?.filter((m) => m.role === 'interviewer')
            ?.slice(-1)[0];
          setInterviewerText(lastMsg?.content || 'Welcome to the interview!');
          if (location.state?.audio || data.lastAudio) {
            setCurrentAudio(location.state?.audio || data.lastAudio);
            setInterviewerState(STATE_SPEAKING);
          } else {
            setInterviewerState(STATE_LISTENING);
          }
        }
      } catch (err) {
        toast.error('Failed to load interview');
      } finally {
        setLoading(false);
      }
    };
    if (id) loadInterview();
  }, [id, location.state]);

  const handleAudioEnded = () => {
    setInterviewerState(STATE_LISTENING);
  };

  const resetAnswerFields = () => {
    setTextAnswer('');
    setCode('');
    setCodeEvaluation(null);
    setShowTextFallback(false);
  };

  const processAnswerResult = (result) => {
    if (result.isComplete) {
      setInterviewerState(STATE_FAREWELL);
      setFarewellMessage(
        'That concludes our interview! Great job. Redirecting to your feedback report...'
      );
      setTimeout(() => {
        navigate(`/feedback/${id}`);
      }, 2500);
    } else {
      setCurrentQuestionNum(result.currentQuestion);
      setCurrentQuestion(result.question);
      setInterviewerText(`${result.followUp || ''} ${result.question?.text || ''}`);
      if (result.audio) {
        setCurrentAudio(result.audio);
        setAudioKey((prev) => prev + 1);
        setInterviewerState(STATE_SPEAKING);
      } else {
        setInterviewerState(STATE_LISTENING);
      }
      resetAnswerFields();
    }
  };

  const submitAndProcess = async (text) => {
    setSubmitting(true);
    setInterviewerState(STATE_THINKING);
    try {
      const result = await submitTextAnswer(id, text);
      processAnswerResult(result);
    } catch (err) {
      toast.error('Failed to submit answer');
      setInterviewerState(STATE_LISTENING);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordingComplete = async (audioBlob) => {
    setSubmitting(true);
    setInterviewerState(STATE_THINKING);
    try {
      let transcribedText = '';
      try {
        const res = await transcribeAudio(audioBlob);
        transcribedText = res?.text || '';
      } catch {
        transcribedText = 'Audio response provided by candidate.';
      }
      await submitAndProcess(transcribedText || 'Audio response provided by candidate.');
    } catch (err) {
      toast.error('Audio processing failed');
      setInterviewerState(STATE_LISTENING);
      setSubmitting(false);
    }
  };

  const handleSubmitText = async () => {
    if (!textAnswer.trim()) {
      toast.error('Please enter an answer.');
      return;
    }
    await submitAndProcess(textAnswer.trim());
  };

  const handleSubmitCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      let evaluation = codeEvaluation;
      if (!evaluation) {
        evaluation = await submitCode(id, code, codeLanguage);
        setCodeEvaluation(evaluation);
        toast.success('Code evaluated!');
      }
      await submitAndProcess(
        `Candidate submitted code solution:\n\`\`\`${codeLanguage}\n${code}\n\`\`\`\nEvaluation: ${
          evaluation?.feedback || 'Evaluated'
        }`
      );
    } catch (err) {
      toast.error('Failed to submit code');
      setSubmitting(false);
    }
  };

  const handleEndInterview = async () => {
    setEnding(true);
    try {
      await endInterview(id);
      navigate(`/feedback/${id}`);
    } catch (err) {
      toast.error('Failed to end interview');
    } finally {
      setEnding(false);
    }
  };

  if (loading) {
    return (
      <div className="interview-loading-state">
        <div className="spinner-border spinner-border-sm" role="status" />
        <p className="interview-loading-text">Loading interview...</p>
      </div>
    );
  }

  const isCodeQuestion = currentQuestion?.isCodeQuestion;
  const progressPercent = (currentQuestionNum / totalQuestions) * 100;
  const isSpeaking = interviewerState === STATE_SPEAKING;
  const isThinking = interviewerState === STATE_THINKING;
  const isListening = interviewerState === STATE_LISTENING;
  const isFarewell = interviewerState === STATE_FAREWELL;

  return (
    <div className="interview-layout">
      <div className="interview-topbar">
        <div className="topbar-left">
          <span className="topbar-question-label">
            Question {currentQuestionNum} of {totalQuestions}
          </span>
          <div className="topbar-progress-track">
            <div
              className="topbar-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <div className="topbar-right">
          {currentQuestionNum >= totalQuestions && isListening && (
            <button
              className={`topbar-end-btn ${ending ? 'topbar-end-btn-disabled' : ''}`}
              onClick={handleEndInterview}
              disabled={ending}
            >
              {ending ? 'Generating Feedback...' : 'End Interview'}
            </button>
          )}
        </div>
      </div>

      <div className="interviewer-panel">
        <div className="interviewer-avatar-block">
          <div className="interviewer-avatar-circle">
            <FaUserTie className="interviewer-avatar-icon" />
          </div>
          <div className="interviewer-avatar-info">
            <span className="interviewer-avatar-name">Natalie</span>
            <span className="interviewer-avatar-role">AI Interviewer</span>
          </div>
        </div>

        <div className="interviewer-status-block">
          {isSpeaking && (
            <span className="status-text status-speaking">Speaking...</span>
          )}
          {isThinking && (
            <div className="status-thinking-row">
              <div className="spinner-border spinner-border-sm" role="status" />
              <span className="status-text status-thinking">Thinking...</span>
            </div>
          )}
          {isListening && (
            <div className="status-listening-row">
              <BsRecordCircleFill className="status-listening-icon" />
              <span className="status-text status-listening">
                Your turn to answer
              </span>
            </div>
          )}
          {isFarewell && (
            <div className="status-farewell-row">
              <div className="spinner-border spinner-border-sm" role="status" />
              <span className="status-text status-farewell">
                Wrapping up...
              </span>
            </div>
          )}
        </div>

        {currentAudio && (
          <AudioPlayer
            key={audioKey}
            audioBase64={currentAudio}
            autoPlay={true}
            onEnded={handleAudioEnded}
          />
        )}

        {isFarewell && (
          <div className="interviewer-farewell-block">
            <p className="interviewer-farewell-text">{farewellMessage}</p>
            <div className="spinner-border spinner-border-sm" role="status" />
          </div>
        )}

        {!isFarewell && !isThinking && interviewerText && (
          <div className="interviewer-message-block">
            <p className="interviewer-message-text">{interviewerText}</p>
            {isListening && currentAudio && (
              <button
                className="interviewer-hear-again-link"
                onClick={() => {
                  setAudioKey((prev) => prev + 1);
                  setInterviewerState(STATE_SPEAKING);
                }}
              >
                Hear Again
              </button>
            )}
          </div>
        )}

        {!isFarewell && currentQuestion && !isThinking && (
          <div className="interviewer-question-callout">
            <div className="question-callout-header">
              <span className="question-num-badge">Q{currentQuestionNum}</span>
              <span className="question-type-badge">{currentQuestion.type}</span>
              {isCodeQuestion && (
                <span className="question-code-badge">
                  <BsCodeSlash className="question-code-icon" /> Code
                </span>
              )}
            </div>
            <p className="question-callout-text">{currentQuestion.text}</p>
          </div>
        )}
      </div>

      <div className="answer-panel">
        {isListening && (
          <>
            {!isCodeQuestion && (
              <>
                <div className="voice-answer-block">
                  <div className="voice-block-header">
                    <div>
                      <h3 className="voice-block-title">Record Your Answer</h3>
                      <p className="voice-block-desc">
                        Click record, speak your answer (max 5 min), then submit
                      </p>
                    </div>
                  </div>
                  <div className="voice-block-area">
                    {!submitting && (
                      <VoiceRecorder
                        onRecordingComplete={handleRecordingComplete}
                        disabled={submitting}
                      />
                    )}
                    {submitting && (
                      <div className="processing-indicator">
                        <div
                          className="spinner-border spinner-border-sm"
                          role="status"
                        />
                        <p className="processing-text">
                          Processing your answer...
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-fallback-block">
                  <button
                    className="text-fallback-toggle-btn"
                    onClick={() => setShowTextFallback(!showTextFallback)}
                  >
                    <span className="text-fallback-toggle-label">
                      <BsKeyboardFill className="text-fallback-icon" />
                      {showTextFallback
                        ? 'Hide text input'
                        : 'Prefer typing instead?'}
                    </span>
                    <span
                      className={
                        showTextFallback
                          ? 'toggle-arrow-open'
                          : 'toggle-arrow-closed'
                      }
                    >
                      &#9660;
                    </span>
                  </button>
                  {showTextFallback && (
                    <div className="text-answer-block">
                      <textarea
                        className={`text-answer-textarea ${submitting ? 'text-answer-textarea-disabled' : ''}`}
                        placeholder="Type your answer here..."
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        rows={4}
                        disabled={submitting}
                      />
                      <button
                        className={`submit-text-btn ${submitting || !textAnswer.trim() ? 'submit-text-btn-disabled' : ''}`}
                        onClick={handleSubmitText}
                        disabled={submitting || !textAnswer.trim()}
                      >
                        {submitting ? 'Submitting...' : 'Submit Text Answer'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {isCodeQuestion && (
              <div className="code-answer-block">
                <div className="code-block-header">
                  <h3 className="code-block-title">
                    <BsCodeSlash className="code-title-icon" />
                    {currentQuestion.codeType === 'fix'
                      ? 'Fix the Code'
                      : currentQuestion.codeType === 'explain'
                      ? 'Explain the Code'
                      : 'Write Your Solution'}
                  </h3>
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="code-language-select"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>

                {currentQuestion.codeSnippet && (
                  <div className="code-snippet-box">
                    <h4 className="code-snippet-label">
                      {currentQuestion.codeType === 'fix'
                        ? 'Buggy Code:'
                        : 'Code to Explain:'}
                    </h4>
                    <pre className="code-snippet-pre">
                      {currentQuestion.codeSnippet}
                    </pre>
                  </div>
                )}

                {currentQuestion.codeType !== 'explain' ? (
                  <>
                    <CodeEditor
                      value={
                        code ||
                        (currentQuestion.codeType === 'fix'
                          ? currentQuestion.codeSnippet || ''
                          : '')
                      }
                      onChange={(val) => setCode(val || '')}
                      language={currentQuestion.codeLanguage || codeLanguage}
                    />
                    <button
                      className={`submit-code-btn ${submitting || !code.trim() ? 'submit-code-btn-disabled' : ''}`}
                      onClick={handleSubmitCode}
                      disabled={submitting || !code.trim()}
                    >
                      {submitting
                        ? 'Evaluating...'
                        : codeEvaluation && currentQuestionNum >= totalQuestions
                        ? 'Finish Interview & View Feedback'
                        : currentQuestion.codeType === 'fix'
                        ? 'Submit Fixed Code'
                        : 'Submit Solution'}
                    </button>
                  </>
                ) : (
                  <div className="explain-answer-block">
                    <p className="explain-hint-text">
                      Explain verbally what this code does, or type your
                      explanation below.
                    </p>

                    <div className="voice-block-area">
                      {!submitting && (
                        <VoiceRecorder
                          onRecordingComplete={async (audioBlob) => {
                            setSubmitting(true);
                            setInterviewerState(STATE_THINKING);
                            try {
                              const data = await transcribeAudio(audioBlob);
                              const text =
                                data.text || 'Verbal explanation provided.';
                              setCode(text);
                              setTimeout(() => handleSubmitCode(), 100);
                            } catch (error) {
                              setCode('Verbal explanation provided.');
                              setTimeout(() => handleSubmitCode(), 100);
                            }
                          }}
                          disabled={submitting}
                        />
                      )}
                      {submitting && (
                        <div className="processing-indicator">
                          <div
                            className="spinner-border spinner-border-sm"
                            role="status"
                          />
                          <p className="processing-text">
                            Processing your explanation...
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="text-fallback-block">
                      <button
                        className="text-fallback-toggle-btn"
                        onClick={() => setShowTextFallback(!showTextFallback)}
                      >
                        <span className="text-fallback-toggle-label">
                          <BsKeyboardFill className="text-fallback-icon" />
                          {showTextFallback
                            ? 'Hide'
                            : 'Prefer typing your explanation?'}
                        </span>
                        <span
                          className={
                            showTextFallback
                              ? 'toggle-arrow-open'
                              : 'toggle-arrow-closed'
                          }
                        >
                          &#9660;
                        </span>
                      </button>
                      {showTextFallback && (
                        <div className="text-answer-block">
                          <textarea
                            className={`text-answer-textarea ${submitting ? 'text-answer-textarea-disabled' : ''}`}
                            placeholder="Type your explanation... What does this code do?"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            rows={4}
                            disabled={submitting}
                          />
                          <button
                            className={`submit-code-btn ${submitting || !code.trim() ? 'submit-code-btn-disabled' : ''}`}
                            onClick={handleSubmitCode}
                            disabled={submitting || !code.trim()}
                          >
                            {submitting
                              ? 'Evaluating...'
                              : 'Submit Explanation'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {codeEvaluation && (
                  <div
                    className={
                      codeEvaluation.isCorrect
                        ? 'code-eval-block code-eval-correct'
                        : 'code-eval-block code-eval-incorrect'
                    }
                  >
                    <div className="code-eval-header">
                      <span className="code-eval-status">
                        {codeEvaluation.isCorrect ? (
                          <>
                            <BsCheckCircleFill className="code-eval-icon-correct" />
                            Correct
                          </>
                        ) : (
                          <>
                            <BsXCircleFill className="code-eval-icon-incorrect" />
                            Needs Improvement
                          </>
                        )}
                      </span>
                      <span className="code-eval-score">
                        Score: {codeEvaluation.score}/100
                      </span>
                    </div>
                    <p className="code-eval-feedback">
                      {codeEvaluation.feedback}
                    </p>
                    {codeEvaluation.suggestions && (
                      <p className="code-eval-suggestions">
                        <strong>Tip:</strong> {codeEvaluation.suggestions}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {isSpeaking && (
          <div className="answer-panel-status">
            <p className="answer-panel-status-text">
              Natalie is speaking... please listen carefully
            </p>
          </div>
        )}
        {isThinking && (
          <div className="answer-panel-status">
            <div className="spinner-border spinner-border-sm" role="status" />
            <p className="answer-panel-status-text">
              Natalie is preparing the next question...
            </p>
          </div>
        )}
        {isFarewell && (
          <div className="answer-panel-status">
            <div className="spinner-border spinner-border-sm" role="status" />
            <p className="answer-panel-status-text">
              Generating your feedback report...
            </p>
          </div>
        )}
      </div>

      <div className="interview-timeline">
        <div className="timeline-dots-row">
          {Array.from({ length: totalQuestions }, (_, i) => {
            const qNum = i + 1;
            const isAnswered = qNum < currentQuestionNum;
            const isCurrent = qNum === currentQuestionNum;
            let dotClass = 'timeline-dot-circle';
            if (isAnswered) dotClass += ' timeline-dot-answered';
            if (isCurrent) dotClass += ' timeline-dot-current';
            return (
              <div key={i} className={dotClass}>
                {isAnswered ? (
                  <BsCheck className="timeline-check-icon" />
                ) : (
                  qNum
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default InterviewPage;
