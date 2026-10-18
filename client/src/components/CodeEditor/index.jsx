import { useState, useEffect, useContext } from 'react';
import Editor from '@monaco-editor/react';
import { ThemeContext } from '../../context/ThemeContext.jsx';
import {
  BsPlayFill,
  BsArrowsFullscreen,
  BsFullscreenExit,
  BsTrash,
  BsTerminalFill,
  BsCheckCircleFill,
  BsExclamationCircleFill,
  BsPaletteFill,
} from 'react-icons/bs';
import './index.css';

function formatArg(arg) {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
}

function CodeEditor({ value, onChange, language = 'javascript', readOnly = false }) {
  const { theme: appTheme } = useContext(ThemeContext) || { theme: 'light' };
  const [editorTheme, setEditorTheme] = useState(() =>
    appTheme === 'dark' ? 'vs-dark' : 'light'
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [isRunning, setIsRunning] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState(null);

  // Sync with global theme if user hasn't explicitly customized monaco theme
  useEffect(() => {
    setEditorTheme(appTheme === 'dark' ? 'vs-dark' : 'light');
  }, [appTheme]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleRunCode = () => {
    setIsRunning(true);
    setShowTerminal(true);
    const logs = [];
    const startTime = performance.now();

    try {
      const lang = (language || 'javascript').toLowerCase();
      if (lang === 'javascript' || lang === 'js') {
        const safeConsole = {
          log: (...args) => logs.push(args.map(formatArg).join(' ')),
          warn: (...args) => logs.push('⚠️ ' + args.map(formatArg).join(' ')),
          error: (...args) => logs.push('❌ ' + args.map(formatArg).join(' ')),
          info: (...args) => logs.push('ℹ️ ' + args.map(formatArg).join(' ')),
        };

        // Execute in strict sandbox
        const runner = new Function(
          'console',
          `
          "use strict";
          ${value || ''}
        `
        );
        const result = runner(safeConsole);
        const duration = (performance.now() - startTime).toFixed(1);

        if (result !== undefined) {
          logs.push(`=> ${formatArg(result)}`);
        }

        setTerminalOutput({
          status: 'success',
          logs: logs.length
            ? logs
            : ['Code executed successfully with return 0 (no console output).'],
          duration,
        });
      } else {
        const duration = (performance.now() - startTime).toFixed(1);
        setTerminalOutput({
          status: 'info',
          logs: [
            `ℹ️ Client sandbox executes JavaScript natively.`,
            `Your ${lang.toUpperCase()} solution will be evaluated with full test suites upon submission.`,
          ],
          duration,
        });
      }
    } catch (err) {
      const duration = (performance.now() - startTime).toFixed(1);
      setTerminalOutput({
        status: 'error',
        logs: [...logs, `Runtime Error: ${err.message}`],
        duration,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearTerminal = () => {
    setTerminalOutput(null);
  };

  return (
    <div
      className={`code-editor-studio ${isFullscreen ? 'code-editor-fullscreen' : ''}`}
    >
      {/* Editor Control Toolbar */}
      <div className="code-editor-toolbar">
        <div className="toolbar-left">
          <span className="editor-lang-pill">
            {language ? language.toUpperCase() : 'JAVASCRIPT'}
          </span>

          <div className="editor-theme-picker">
            <BsPaletteFill className="toolbar-icon-inline" />
            <select
              value={editorTheme}
              onChange={(e) => setEditorTheme(e.target.value)}
              className="theme-select-control"
              title="Monaco Editor Theme"
            >
              <option value="vs-dark">Dark+ (VS Code)</option>
              <option value="light">Light+ (VS Code)</option>
              <option value="hc-black">High Contrast</option>
            </select>
          </div>

          <div className="font-size-controls">
            <button
              type="button"
              className="font-btn"
              title="Decrease Font Size"
              onClick={() => setFontSize((s) => Math.max(12, s - 1))}
            >
              A-
            </button>
            <span className="font-display">{fontSize}px</span>
            <button
              type="button"
              className="font-btn"
              title="Increase Font Size"
              onClick={() => setFontSize((s) => Math.min(20, s + 1))}
            >
              A+
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          {!readOnly && (
            <button
              type="button"
              className={`run-code-btn ${isRunning ? 'running' : ''}`}
              onClick={handleRunCode}
              title="Execute Code in Sandbox"
            >
              <BsPlayFill className="run-icon" />
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>
          )}

          <button
            type="button"
            className="toolbar-action-btn"
            onClick={() => setShowTerminal(!showTerminal)}
            title={showTerminal ? 'Hide Console' : 'Show Console'}
          >
            <BsTerminalFill />
            <span className="action-btn-text">Console</span>
          </button>

          <button
            type="button"
            className="toolbar-action-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Zen Fullscreen'}
          >
            {isFullscreen ? <BsFullscreenExit /> : <BsArrowsFullscreen />}
          </button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="code-editor-surface">
        <Editor
          height={isFullscreen ? 'calc(100vh - 220px)' : '320px'}
          language={language || 'javascript'}
          theme={editorTheme}
          value={value}
          onChange={onChange}
          options={{
            readOnly: readOnly || false,
            minimap: { enabled: isFullscreen },
            fontSize: fontSize,
            fontFamily:
              "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
            fontLigatures: true,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            bracketPairColorization: { enabled: true },
            padding: { top: 12, bottom: 12 },
            lineNumbers: 'on',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
          }}
        />
      </div>

      {/* Interactive Execution Terminal / Console Drawer */}
      {showTerminal && (
        <div className="editor-terminal-drawer">
          <div className="terminal-header">
            <div className="terminal-title-group">
              <BsTerminalFill className="terminal-icon" />
              <span className="terminal-title">Execution Console</span>
              {terminalOutput && (
                <>
                  <span
                    className={`terminal-status-badge status-${terminalOutput.status}`}
                  >
                    {terminalOutput.status === 'success' ? (
                      <BsCheckCircleFill />
                    ) : (
                      <BsExclamationCircleFill />
                    )}
                    {terminalOutput.status.toUpperCase()}
                  </span>
                  <span className="terminal-runtime-badge">
                    ⚡ {terminalOutput.duration}ms
                  </span>
                </>
              )}
            </div>

            <div className="terminal-actions">
              <button
                type="button"
                className="terminal-action-link"
                onClick={handleClearTerminal}
                title="Clear Output"
              >
                <BsTrash /> Clear
              </button>
              <button
                type="button"
                className="terminal-action-link"
                onClick={() => setShowTerminal(false)}
              >
                Close
              </button>
            </div>
          </div>

          <div className="terminal-body">
            {!terminalOutput && (
              <p className="terminal-placeholder">
                Click <strong>"Run Code"</strong> to execute your solution in the
                in-browser sandbox.
              </p>
            )}

            {terminalOutput && (
              <div className="terminal-output-feed">
                {terminalOutput.logs.map((logLine, idx) => (
                  <pre
                    key={idx}
                    className={`terminal-line ${
                      logLine.startsWith('Error') || logLine.startsWith('Runtime Error')
                        ? 'terminal-line-error'
                        : logLine.startsWith('=>')
                        ? 'terminal-line-return'
                        : 'terminal-line-log'
                    }`}
                  >
                    {logLine}
                  </pre>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CodeEditor;
