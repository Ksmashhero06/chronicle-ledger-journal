import React from 'react';
import { Cpu, Download, Play } from 'lucide-react';
import { ChronicleLogo } from './ChronicleLogo';

interface NavbarProps {
  onOpenTelemetry: () => void;
  onOpenDossier: () => void;
  onRunVerification: () => void;
  verifying: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenTelemetry,
  onOpenDossier,
  onRunVerification,
  verifying,
}) => {
  return (
    <header className="top-header">
      <div className="header-container">
        <div className="brand-section">
          <ChronicleLogo size={30} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="brand-name">Chronicle Ledger</span>
            <span className="directive-pill">
              v2 — AWS Zero to Shipped 2026 • #workplace-efficiency
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-v1 btn-white" onClick={onOpenTelemetry} title="Inspect live AWS Bedrock and Agent Telemetry">
            <Cpu size={14} color="#06B6D4" />
            <span>Agent Telemetry</span>
          </button>

          <button className="btn-v1 btn-white" onClick={onOpenDossier} title="Export compliance dossier">
            <Download size={14} />
            <span>Export Dossier</span>
          </button>

          <button className="btn-v1 btn-black" onClick={onRunVerification} disabled={verifying}>
            <Play size={14} fill={verifying ? 'none' : '#fff'} />
            <span>{verifying ? 'Verifying...' : 'Run Verification'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
