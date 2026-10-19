import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BsSearch,
  BsPlayCircleFill,
  BsTrophyFill,
  BsStarFill,
  BsCashStack,
  BsFileEarmarkCheck,
  BsDiagram3,
  BsClockHistory,
  BsGearFill,
  BsSunFill,
  BsMoonStarsFill,
} from 'react-icons/bs';
import './index.css';

const COMMANDS = [
  {
    id: 'start-standard',
    title: 'Start Standard Mock Interview',
    category: 'Interviews',
    icon: BsPlayCircleFill,
    path: '/setup',
    shortcut: 'S',
  },
  {
    id: 'start-superday',
    title: 'Launch FAANG Superday 4-Round Loop',
    category: 'Interviews',
    icon: BsTrophyFill,
    path: '/setup',
    shortcut: 'F',
  },
  {
    id: 'star-bank',
    title: 'Behavioral STAR Story Bank & Repertoire',
    category: 'Preparation',
    icon: BsStarFill,
    path: '/star-bank',
    shortcut: 'B',
  },
  {
    id: 'negotiate',
    title: 'AI Salary & Offer Negotiation Simulator',
    category: 'Career & Offer',
    icon: BsCashStack,
    path: '/negotiate',
    shortcut: 'N',
  },
  {
    id: 'ats-studio',
    title: 'ATS Resume Optimizer & STAR Bullet Rewrites',
    category: 'Preparation',
    icon: BsFileEarmarkCheck,
    path: '/resume-optimizer',
    shortcut: 'R',
  },
  {
    id: 'history',
    title: 'Performance History & Analytics',
    category: 'Analytics',
    icon: BsClockHistory,
    path: '/history',
    shortcut: 'H',
  },
  {
    id: 'settings',
    title: 'Audio Devices & Account Settings',
    category: 'Preferences',
    icon: BsGearFill,
    path: '/settings',
    shortcut: ',',
  },
];

function CommandPalette({ isOpen, onClose, onToggleTheme, theme }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredCommands = [
    ...COMMANDS,
    {
      id: 'toggle-theme',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      category: 'Preferences',
      icon: theme === 'dark' ? BsSunFill : BsMoonStarsFill,
      action: onToggleTheme,
      shortcut: 'T',
    },
  ].filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (cmd) => {
    if (cmd.action) {
      cmd.action();
    } else if (cmd.path) {
      navigate(cmd.path);
    }
    onClose();
  };

  const handleKeyDownInMenu = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? filteredCommands.length - 1 : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleSelect(filteredCommands[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette-modal" onClick={(e) => e.stopPropagation()}>
        <div className="palette-search-row">
          <BsSearch className="palette-search-icon" />
          <input
            type="text"
            className="palette-search-input"
            placeholder="Type a command or jump to feature... (↑↓ to navigate, ↵ to select)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInMenu}
            autoFocus
          />
          <kbd className="palette-esc-kbd">ESC</kbd>
        </div>

        <div className="palette-list">
          {filteredCommands.length === 0 ? (
            <div className="palette-empty-state">
              No matching commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              return (
                <div
                  key={cmd.id}
                  className={`palette-item ${idx === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleSelect(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="palette-item-left">
                    <div className="palette-item-icon">
                      <Icon />
                    </div>
                    <div>
                      <span className="palette-item-title">{cmd.title}</span>
                      <span className="palette-item-cat">{cmd.category}</span>
                    </div>
                  </div>
                  {cmd.shortcut && (
                    <kbd className="palette-shortcut-kbd">{cmd.shortcut}</kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="palette-footer">
          <span>Navigate with <kbd>↑</kbd> <kbd>↓</kbd></span>
          <span>Select with <kbd>↵ Enter</kbd></span>
          <span>Close with <kbd>Esc</kbd></span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
