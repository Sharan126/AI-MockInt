import React, { useState, useRef } from 'react';
import {
  FiServer,
  FiDatabase,
  FiGlobe,
  FiLayers,
  FiCpu,
  FiTrash2,
  FiX,
  FiAlertTriangle,
  FiCheckCircle,
  FiActivity,
  FiShield,
} from 'react-icons/fi';
import { BsDiagram3, BsLightningCharge } from 'react-icons/bs';
import { auditWhiteboard } from '../../services/interviewService.js';
import './index.css';

const PALETTE = [
  { type: 'Client', icon: FiGlobe, label: 'Client / App', color: '#3b82f6' },
  { type: 'LoadBalancer', icon: FiLayers, label: 'Load Balancer', color: '#8b5cf6' },
  { type: 'APIGateway', icon: FiServer, label: 'API Gateway', color: '#6366f1' },
  { type: 'Service', icon: FiCpu, label: 'Microservice', color: '#10b981' },
  { type: 'Cache', icon: BsLightningCharge, label: 'Redis Cache', color: '#ef4444' },
  { type: 'Database', icon: FiDatabase, label: 'Primary DB', color: '#f59e0b' },
  { type: 'Queue', icon: FiActivity, label: 'Kafka / Queue', color: '#ec4899' },
  { type: 'CDN', icon: FiShield, label: 'CDN Edge', color: '#06b6d4' },
];

const INITIAL_NODES = [
  { id: 'node-1', type: 'Client', label: 'Client (Web/App)', x: 60, y: 140, color: '#3b82f6' },
  { id: 'node-2', type: 'LoadBalancer', label: 'Load Balancer', x: 260, y: 140, color: '#8b5cf6' },
  { id: 'node-3', type: 'Service', label: 'App Microservice', x: 480, y: 140, color: '#10b981' },
  { id: 'node-4', type: 'Cache', label: 'Redis Cache', x: 480, y: 280, color: '#ef4444' },
  { id: 'node-5', type: 'Database', label: 'PostgreSQL DB', x: 700, y: 140, color: '#f59e0b' },
];

const INITIAL_CONNECTIONS = [
  { from: 'node-1', to: 'node-2' },
  { from: 'node-2', to: 'node-3' },
  { from: 'node-3', to: 'node-4' },
  { from: 'node-3', to: 'node-5' },
];

const Whiteboard = ({ interviewId, onClose }) => {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [connections, setConnections] = useState(INITIAL_CONNECTIONS);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [connectingFromId, setConnectingFromId] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [auditing, setAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const canvasRef = useRef(null);

  // Add a new node to canvas
  const handleAddNode = (template) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: template.type,
      label: template.label,
      x: 300 + (Math.random() * 80 - 40),
      y: 180 + (Math.random() * 80 - 40),
      color: template.color,
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  // Dragging logic
  const handleMouseDown = (e, node) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);

    if (connectingFromId && connectingFromId !== node.id) {
      // Complete connection
      const exists = connections.some(
        (c) =>
          (c.from === connectingFromId && c.to === node.id) ||
          (c.from === node.id && c.to === connectingFromId)
      );
      if (!exists) {
        setConnections((prev) => [...prev, { from: connectingFromId, to: node.id }]);
      }
      setConnectingFromId(null);
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    setDraggedNode(node.id);
    setOffset({
      x: e.clientX - rect.left - node.x,
      y: e.clientY - rect.top - node.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!draggedNode) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(10, Math.min(rect.width - 150, e.clientX - rect.left - offset.x));
    const newY = Math.max(10, Math.min(rect.height - 70, e.clientY - rect.top - offset.y));

    setNodes((prev) =>
      prev.map((n) => (n.id === draggedNode ? { ...n, x: newX, y: newY } : n))
    );
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const handleDeleteSelected = () => {
    if (!selectedNodeId) return;
    setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
    setConnections((prev) =>
      prev.filter((c) => c.from !== selectedNodeId && c.to !== selectedNodeId)
    );
    setSelectedNodeId(null);
  };

  const handleClear = () => {
    setNodes([]);
    setConnections([]);
    setSelectedNodeId(null);
    setConnectingFromId(null);
    setAuditResult(null);
  };

  const handleAudit = async () => {
    setAuditing(true);
    try {
      const result = await auditWhiteboard(interviewId, { nodes, connections });
      setAuditResult(result);
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setAuditing(false);
    }
  };

  // Helper to find node by ID for drawing connection lines
  const getNodeById = (id) => nodes.find((n) => n.id === id);

  return (
    <div className="whiteboard-overlay">
      <div className="whiteboard-container">
        {/* Header bar */}
        <div className="whiteboard-header">
          <div className="wb-title-area">
            <BsDiagram3 className="wb-icon" />
            <div>
              <h3>System Design Architecture Whiteboard</h3>
              <p>Drag components, connect data flows, and audit for production SPOFs</p>
            </div>
          </div>

          <div className="wb-actions">
            <button
              className={`wb-btn connect ${connectingFromId ? 'active' : ''}`}
              onClick={() => {
                if (connectingFromId) {
                  setConnectingFromId(null);
                } else if (selectedNodeId) {
                  setConnectingFromId(selectedNodeId);
                }
              }}
              disabled={!selectedNodeId}
              title="Click a component, then click this button, then click target component"
            >
              {connectingFromId ? 'Click target node...' : '🔗 Connect Link'}
            </button>

            {selectedNodeId && (
              <button
                className="wb-btn delete"
                onClick={handleDeleteSelected}
                title="Delete Selected Component"
              >
                <FiTrash2 /> Remove
              </button>
            )}

            <button className="wb-btn clear" onClick={handleClear}>
              Clear
            </button>

            <button
              className="wb-btn audit"
              onClick={handleAudit}
              disabled={auditing || nodes.length === 0}
            >
              <BsLightningCharge /> {auditing ? 'Auditing Architecture...' : 'AI Audit Architecture'}
            </button>

            <button className="wb-btn close" onClick={onClose}>
              <FiX />
            </button>
          </div>
        </div>

        {/* Workspace body */}
        <div className="whiteboard-body">
          {/* Palette Sidebar */}
          <div className="wb-palette">
            <span className="palette-title">Topology Elements</span>
            <div className="palette-grid">
              {PALETTE.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    className="palette-item"
                    onClick={() => handleAddNode(item)}
                    style={{ '--item-color': item.color }}
                  >
                    <Icon className="p-icon" style={{ color: item.color }} />
                    <span className="p-label">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="wb-help-tips">
              <strong>Canvas Quickstart:</strong>
              <ul>
                <li>Click any element above to spawn it on canvas</li>
                <li>Drag boxes to position your topology</li>
                <li>Select a box & click "Connect Link" to pipe data</li>
                <li>Click "AI Audit" for instant architectural feedback</li>
              </ul>
            </div>
          </div>

          {/* Canvas Area */}
          <div
            className="wb-canvas-wrapper"
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={() => {
              setSelectedNodeId(null);
              setConnectingFromId(null);
            }}
          >
            {/* SVG Layer for Connections */}
            <svg className="wb-connections-svg">
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
                </marker>
              </defs>
              {connections.map((conn, idx) => {
                const src = getNodeById(conn.from);
                const dst = getNodeById(conn.to);
                if (!src || !dst) return null;

                const srcCenter = { x: src.x + 75, y: src.y + 35 };
                const dstCenter = { x: dst.x + 75, y: dst.y + 35 };

                return (
                  <line
                    key={idx}
                    x1={srcCenter.x}
                    y1={srcCenter.y}
                    x2={dstCenter.x}
                    y2={dstCenter.y}
                    stroke="#6366f1"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    markerEnd="url(#arrow)"
                    className="topology-line"
                  />
                );
              })}
            </svg>

            {/* Draggable Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isConnecting = connectingFromId === node.id;

              return (
                <div
                  key={node.id}
                  className={`wb-node ${isSelected ? 'selected' : ''} ${
                    isConnecting ? 'connecting' : ''
                  }`}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    borderColor: node.color,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, node)}
                >
                  <div
                    className="wb-node-accent"
                    style={{ background: node.color }}
                  />
                  <div className="wb-node-content">
                    <span className="wb-node-type">{node.type}</span>
                    <span className="wb-node-label">{node.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Audit Results Panel */}
          {auditResult && (
            <div className="wb-audit-panel">
              <div className="audit-header">
                <div className="audit-score-pill">
                  <span className="score-num">{auditResult.scalabilityScore || 85}</span>
                  <span className="score-tag">/ 100 Scalability</span>
                </div>
                <button
                  className="audit-close"
                  onClick={() => setAuditResult(null)}
                >
                  <FiX />
                </button>
              </div>

              <div className="audit-content-scroll">
                {auditResult.spofRisks && auditResult.spofRisks.length > 0 && (
                  <div className="audit-section spof">
                    <h4>
                      <FiAlertTriangle className="section-icon text-amber" />
                      SPOF Bottlenecks & Risks
                    </h4>
                    <ul>
                      {auditResult.spofRisks.map((risk, i) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {auditResult.cachingEvaluation && (
                  <div className="audit-section">
                    <h4>
                      <BsLightningCharge className="section-icon text-purple" />
                      Caching Strategy
                    </h4>
                    <p>{auditResult.cachingEvaluation}</p>
                  </div>
                )}

                {auditResult.databaseStrategy && (
                  <div className="audit-section">
                    <h4>
                      <FiDatabase className="section-icon text-emerald" />
                      Database & Storage Strategy
                    </h4>
                    <p>{auditResult.databaseStrategy}</p>
                  </div>
                )}

                {auditResult.recommendations && auditResult.recommendations.length > 0 && (
                  <div className="audit-section">
                    <h4>
                      <FiCheckCircle className="section-icon text-indigo" />
                      Architectural Recommendations
                    </h4>
                    <ul>
                      {auditResult.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
