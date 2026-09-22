import React, { useState } from 'react';
import { X, Download, Copy, Check, ShieldCheck, Hash } from 'lucide-react';

interface DossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: any;
  loading: boolean;
}

export const DossierModal: React.FC<DossierModalProps> = ({
  isOpen,
  onClose,
  dossier,
  loading,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!dossier) return;
    navigator.clipboard.writeText(JSON.stringify(dossier, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!dossier) return;
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chronicle_Ledger_v2_Dossier_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '820px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={20} />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111' }}>Official Verification Dossier</h3>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>
                Cryptographically Signed Compliance Record for AWS Judges
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {loading || !dossier ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
            Compiling and signing verification dossier...
          </div>
        ) : (
          <div>
            {/* Header Summary Banner */}
            <div
              style={{
                background: '#F8F9FA',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111' }}>{dossier.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>
                    Target: {dossier.competition} ({dossier.submission_category} / {dossier.lane})
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--emerald-pass)' }}>
                    {dossier.readiness_score}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>
                    Readiness Score
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: '#666' }}>
                <span>Verified: <strong style={{ color: 'var(--emerald-pass)' }}>{dossier.status_breakdown.verified}</strong></span>
                <span>Needs Review: <strong style={{ color: 'var(--amber-review)' }}>{dossier.status_breakdown.needs_review}</strong></span>
                <span>Missing: <strong style={{ color: 'var(--rose-missing)' }}>{dossier.status_breakdown.missing}</strong></span>
                <span>Total: <strong style={{ color: '#111' }}>{dossier.status_breakdown.total_requirements}</strong></span>
              </div>
            </div>

            {/* Cryptographic Hash Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                background: '#FFFFFF',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                marginBottom: '1.25rem',
              }}
            >
              <Hash size={14} />
              <span style={{ color: '#888' }}>Dossier SHA-256:</span>
              <span style={{ color: '#111', wordBreak: 'break-all', fontWeight: 600 }}>
                {dossier.cryptographic_dossier_hash}
              </span>
            </div>

            {/* Requirements & Proof Breakdown */}
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.6rem', color: '#333' }}>
              Verified Requirements & Provenance Trace:
            </h4>
            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {dossier.evidence_ledger?.map((item: any) => (
                <div
                  key={item.req_id}
                  style={{
                    background: '#FBFBFB',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 600, background: '#F5F5F5', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{item.req_id}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111' }}>{item.title}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#777', fontFamily: 'var(--font-mono)' }}>
                      Formula: {item.verification?.deterministic_evaluation?.expression || 'None'}
                    </div>
                  </div>
                  <span
                    className={`status-badge ${
                      item.status === 'VERIFIED'
                        ? 'verified'
                        : item.status === 'NEEDS_REVIEW'
                        ? 'needs-review'
                        : 'missing'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button className="btn-v1 btn-white" onClick={handleCopy}>
                {copied ? <Check size={14} color="var(--emerald-pass)" /> : <Copy size={14} />}
                <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
              </button>
              <button className="btn-v1 btn-black" onClick={handleDownload}>
                <Download size={14} />
                <span>Download Official Dossier (.json)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
