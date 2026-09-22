import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileSearch,
  Code2,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';
import type { Project, VerificationRecord } from '../types';

interface SplitPaneInspectorProps {
  project: Project;
}

export const SplitPaneInspector: React.FC<SplitPaneInspectorProps> = ({ project }) => {
  const [selectedReqId, setSelectedReqId] = useState<string>(
    project.requirements[0]?.req_id || ''
  );
  const [filter, setFilter] = useState<'ALL' | 'VERIFIED' | 'NEEDS_REVIEW' | 'MISSING'>('ALL');

  // Active requirement
  const activeReq =
    project.requirements.find((r) => r.req_id === selectedReqId) ||
    project.requirements[0];

  // Matching verification record
  const activeVerif: VerificationRecord | undefined = project.verifications.find(
    (v) => v.req_id === activeReq?.req_id
  );

  const filteredRequirements = project.requirements.filter((r) => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  return (
    <div className="split-pane-wrapper">
      {/* LEFT PANE: Structured Requirements Tree */}
      <div className="glass-card">
        <div className="pane-header">
          <div className="pane-title">
            <FileSearch size={18} color="var(--aws-gold)" />
            <span>Structured Requirements ({project.requirements.length})</span>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {(['ALL', 'VERIFIED', 'NEEDS_REVIEW', 'MISSING'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  background: filter === tab ? 'rgba(255, 153, 0, 0.15)' : 'transparent',
                  color: filter === tab ? 'var(--aws-gold)' : 'var(--text-muted)',
                  border: filter === tab ? '1px solid var(--border-active)' : '1px solid transparent',
                  borderRadius: '6px',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="requirement-list">
          {filteredRequirements.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No requirements match the current filter.
            </div>
          ) : (
            filteredRequirements.map((req) => {
              const isSelected = req.req_id === activeReq?.req_id;
              const statusClass =
                req.status === 'VERIFIED'
                  ? 'status-verified'
                  : req.status === 'NEEDS_REVIEW'
                  ? 'status-needs-review'
                  : 'status-missing';

              return (
                <div
                  key={req.req_id}
                  className={`req-item ${isSelected ? 'req-item-active' : ''}`}
                  onClick={() => setSelectedReqId(req.req_id)}
                >
                  <div className="req-top-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="req-id-badge">{req.req_id}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {req.category}
                      </span>
                    </div>
                    <span className={`req-status-pill ${statusClass}`}>{req.status.replace('_', ' ')}</span>
                  </div>

                  <div className="req-title">{req.title}</div>
                  <div className="req-desc">{req.description}</div>

                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        color: 'var(--cyber-cyan)',
                      }}
                    >
                      {req.rule_type}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        color: req.severity === 'CRITICAL' ? 'var(--rose-missing)' : 'var(--text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      {req.severity}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANE: Evidence Provenance & Deterministic Proof Inspector */}
      <div className="glass-card">
        <div className="pane-header">
          <div className="pane-title">
            <ShieldCheck size={18} color="var(--cyber-cyan)" />
            <span>Deterministic Proof & Evidence Provenance</span>
          </div>

          {activeReq && (
            <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--cyber-cyan)' }}>
              {activeReq.req_id}
            </span>
          )}
        </div>

        {activeReq ? (
          <div className="provenance-viewer">
            {/* 1. Deterministic AST Expression Ribbon */}
            <div className="formula-ribbon">
              <div className="formula-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Code2 size={14} color="var(--aws-gold)" />
                  <span>Deterministic AST Evaluator</span>
                </div>
                {activeVerif?.deterministic_evaluation?.passed ? (
                  <span style={{ color: 'var(--emerald-pass)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle2 size={12} /> PROVEN TRUE
                  </span>
                ) : (
                  <span style={{ color: 'var(--rose-missing)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertTriangle size={12} /> ATTENTION REQUIRED
                  </span>
                )}
              </div>

              <div className="formula-code">
                {activeVerif?.deterministic_evaluation?.expression || 'No evaluation executed yet'}
              </div>

              <div className="formula-desc">
                {activeVerif?.deterministic_evaluation?.explanation ||
                  'Attach evidence and run the deterministic verification engine to generate proof.'}
              </div>
            </div>

            {/* 2. Evidence Citation Box */}
            <div className="citation-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  <FileCheck size={16} color="var(--cyber-cyan)" />
                  <span>
                    Citation Source: {activeVerif?.provenance?.evidence_file || 'No Evidence Matched'}
                  </span>
                </div>

                {activeVerif?.provenance?.page_number && (
                  <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
                    Page {activeVerif.provenance.page_number}
                  </span>
                )}
              </div>

              {activeVerif?.provenance ? (
                <>
                  <div className="citation-snippet-box">
                    <span className="highlight-span">
                      "{activeVerif.provenance.verbatim_snippet}"
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>
                      Detected Fact: <strong style={{ color: '#fff' }}>{String(activeVerif.provenance.extracted_value)}</strong>
                    </span>
                    <span>
                      Confidence: <strong style={{ color: 'var(--emerald-pass)' }}>{(activeVerif.provenance.confidence * 100).toFixed(1)}%</strong>
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No supporting evidence snippet attached for this requirement. Upload project documents or reports to satisfy this check.
                </div>
              )}

              {/* 3. Cryptographic Provenance Metadata */}
              <div className="metadata-grid">
                <div className="meta-item">
                  <span className="meta-label">Artifact SHA-256</span>
                  <span className="meta-val">
                    {activeVerif?.provenance?.evidence_sha256
                      ? `${activeVerif.provenance.evidence_sha256.substring(0, 18)}...`
                      : 'None'}
                  </span>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Audit Decision Hash</span>
                  <span className="meta-val">
                    {activeVerif?.audit_hash
                      ? `${activeVerif.audit_hash.substring(0, 18)}...`
                      : 'Unverified'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a requirement from the left to inspect its deterministic proof and evidence provenance.
          </div>
        )}
      </div>
    </div>
  );
};
