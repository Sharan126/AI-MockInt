import { useState, useId } from 'react';
import './index.css';

/**
 * RadarChart - Pure SVG 5-axis Spider/Radar Skills Visualizer
 * Zero-dependency, responsive, and themed.
 * Compares Candidate vs. FAANG Benchmark (80%).
 */
function RadarChart({ categoryScores }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const gradientId = useId();

  const axes = [
    {
      key: 'technicalKnowledge',
      label: 'Technical Knowledge',
      score: categoryScores?.technicalKnowledge?.score ?? 75,
    },
    {
      key: 'problemSolving',
      label: 'Problem Solving',
      score: categoryScores?.problemSolving?.score ?? 75,
    },
    {
      key: 'codeQuality',
      label: 'Code Quality',
      score: categoryScores?.codeQuality?.score ?? 70,
    },
    {
      key: 'confidence',
      label: 'Confidence',
      score: categoryScores?.confidence?.score ?? 80,
    },
    {
      key: 'communicationSkills',
      label: 'Communication',
      score: categoryScores?.communicationSkills?.score ?? 80,
    },
  ];

  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 110;
  const totalAxes = axes.length;

  const getCoordinates = (index, value) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / totalAxes;
    const r = (value / 100) * radius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Generate concentric polygon grid rings (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [20, 40, 60, 80, 100];
  const gridPolygons = gridLevels.map((lvl) => {
    return axes
      .map((_, i) => {
        const { x, y } = getCoordinates(i, lvl);
        return `${x},${y}`;
      })
      .join(' ');
  });

  // Candidate polygon
  const candidatePoints = axes
    .map((axis, i) => {
      const { x, y } = getCoordinates(i, axis.score);
      return `${x},${y}`;
    })
    .join(' ');

  // FAANG Benchmark polygon (80% across all axes)
  const benchmarkPoints = axes
    .map((_, i) => {
      const { x, y } = getCoordinates(i, 80);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="radar-chart-card">
      <div className="radar-chart-header">
        <h3 className="radar-chart-title">Candidate Skill Spectrum</h3>
        <div className="radar-legend">
          <span className="legend-item legend-candidate">
            <span className="legend-swatch candidate-swatch" />
            Your Performance
          </span>
          <span className="legend-item legend-benchmark">
            <span className="legend-swatch benchmark-swatch" />
            Senior Benchmark (80%)
          </span>
        </div>
      </div>

      <div className="radar-chart-svg-wrapper">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="radar-chart-svg"
          aria-label="Radar chart of interview skills"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Concentric grid lines */}
          {gridPolygons.map((points, idx) => (
            <polygon
              key={idx}
              points={points}
              className={`radar-grid-polygon ${idx === 3 ? 'benchmark-ring' : ''}`}
            />
          ))}

          {/* Radial Axis lines */}
          {axes.map((_, i) => {
            const { x, y } = getCoordinates(i, 100);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                className="radar-axis-line"
              />
            );
          })}

          {/* FAANG Benchmark polygon */}
          <polygon
            points={benchmarkPoints}
            className="radar-benchmark-polygon"
          />

          {/* Candidate score polygon */}
          <polygon
            points={candidatePoints}
            className="radar-candidate-polygon"
            fill={`url(#${gradientId})`}
          />

          {/* Data Points on vertices */}
          {axes.map((axis, i) => {
            const { x, y } = getCoordinates(i, axis.score);
            const isHovered = hoveredIndex === i;
            return (
              <g
                key={axis.key}
                className={`radar-point-group ${isHovered ? 'active' : ''}`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 7 : 5}
                  className="radar-candidate-point"
                />
              </g>
            );
          })}

          {/* Axis Labels */}
          {axes.map((axis, i) => {
            const { x, y } = getCoordinates(i, 124);
            const isHovered = hoveredIndex === i;
            let textAnchor = 'middle';
            if (x < cx - 15) textAnchor = 'end';
            if (x > cx + 15) textAnchor = 'start';

            return (
              <g key={`lbl-${axis.key}`} className="radar-label-group">
                <text
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  className={`radar-axis-label ${isHovered ? 'label-active' : ''}`}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {axis.label}
                  <tspan
                    x={x}
                    dy="14"
                    className="radar-axis-score-val"
                    textAnchor={textAnchor}
                  >
                    {axis.score}/100
                  </tspan>
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {hoveredIndex !== null && (
        <div className="radar-tooltip-card">
          <span className="tooltip-name">{axes[hoveredIndex].label}</span>
          <span className="tooltip-score">
            Score: <strong>{axes[hoveredIndex].score}</strong>/100
          </span>
        </div>
      )}
    </div>
  );
}

export default RadarChart;
