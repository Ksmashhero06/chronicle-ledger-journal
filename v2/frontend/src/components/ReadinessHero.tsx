import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, FileText, Upload, Play, Download } from 'lucide-react';
import type { Project } from '../types';

interface ReadinessHeroProps {
  project: Project;
  onOpenRequirements: () => void;
  onOpenEvidence: () => void;
  onRunVerification: () => void;
  onOpenDossier: () => void;
  verifying: boolean;
}

export const ReadinessHero: React.FC<ReadinessHeroProps> = ({
  project,
  onOpenRequirements,
  onOpenEvidence,
  onRunVerification,
  onOpenDossier,
  verifying,
}) => {
  const score = project.readiness_score || 0;
  const scoreColor =
    score >= 75 ? 'var(--emerald-pass)' : score >= 40 ? 'var(--amber-review)' : 'var(--rose-missing)';

  // Calculate SVG circular stroke offset
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <section className="hero-readiness">
      {/* 1. Circular Gauge */}
      <div className="glass-card score-display-card">
        <div className="circular-score-ring">
          <svg width="170" height="170" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="85"
              cy="85"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="85"
              cy="85"
              r={radius}
              stroke={scoreColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <div className="score-number" style={{ color: scoreColor }}>
              {score}%
            </div>
            <div className="score-label">Readiness</div>
          </div>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {project.competition}
        </div>
      </div>

      {/* 2. Stat Metric Breakdown */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Submission Verification State</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
                {project.category}
              </span>
              <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
                {project.lane}
              </span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            Chronicle Ledger v2 evaluates every requirement against attached evidence using AI perception for fact extraction paired with deterministic AST logic for final validation.
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-tile stat-tile-verified">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="var(--emerald-pass)" />
              <span className="stat-title">Verified</span>
            </div>
            <div className="stat-val" style={{ color: 'var(--emerald-pass)' }}>
              {project.verified_count}
            </div>
          </div>

          <div className="stat-tile stat-tile-review">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={16} color="var(--amber-review)" />
              <span className="stat-title">Needs Review</span>
            </div>
            <div className="stat-val" style={{ color: 'var(--amber-review)' }}>
              {project.needs_review_count}
            </div>
          </div>

          <div className="stat-tile stat-tile-missing">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <XCircle size={16} color="var(--rose-missing)" />
              <span className="stat-title">Missing</span>
            </div>
            <div className="stat-val" style={{ color: 'var(--rose-missing)' }}>
              {project.missing_count}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Controls */}
      <div className="glass-card action-panel">
        <button className="btn btn-primary" onClick={onRunVerification} disabled={verifying}>
          <Play size={16} />
          <span>{verifying ? 'Evaluating AST Rules...' : 'Run Verification Engine'}</span>
        </button>

        <button className="btn btn-secondary" onClick={onOpenRequirements}>
          <FileText size={16} color="var(--aws-gold)" />
          <span>Extract Requirements</span>
        </button>

        <button className="btn btn-secondary" onClick={onOpenEvidence}>
          <Upload size={16} color="var(--cyber-cyan)" />
          <span>Attach Evidence</span>
        </button>

        <button className="btn btn-cyan" onClick={onOpenDossier}>
          <Download size={16} />
          <span>Export Official Dossier</span>
        </button>
      </div>
    </section>
  );
};
