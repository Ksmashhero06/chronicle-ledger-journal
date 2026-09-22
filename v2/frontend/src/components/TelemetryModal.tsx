import React from 'react';
import { X, Cpu, Activity, Clock, Zap, CheckCircle2 } from 'lucide-react';
import type { TelemetrySummary } from '../types';

interface TelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: TelemetrySummary | null;
}

export const TelemetryModal: React.FC<TelemetryModalProps> = ({
  isOpen,
  onClose,
  telemetry,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '780px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Cpu size={20} />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111' }}>AWS Agent & Bedrock Telemetry HUD</h3>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>
                Auditable Telemetry Verifying AWS Agent Integration
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

        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#F8F9FA', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#666', fontSize: '0.72rem', fontWeight: 600 }}>
              <Activity size={13} />
              <span>Invocations</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111', marginTop: '0.25rem' }}>
              {telemetry?.total_invocations || 0}
            </div>
          </div>

          <div style={{ background: '#F8F9FA', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#666', fontSize: '0.72rem', fontWeight: 600 }}>
              <Clock size={13} />
              <span>Avg Latency</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111', marginTop: '0.25rem' }}>
              {telemetry?.avg_latency_ms || 0}<span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#666' }}>ms</span>
            </div>
          </div>

          <div style={{ background: '#F8F9FA', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#666', fontSize: '0.72rem', fontWeight: 600 }}>
              <Zap size={13} color="var(--emerald-pass)" />
              <span>Tokens Processed</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111', marginTop: '0.25rem' }}>
              {telemetry?.total_tokens_processed || 0}
            </div>
          </div>

          <div style={{ background: '#F8F9FA', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#666', fontSize: '0.72rem', fontWeight: 600 }}>
              <CheckCircle2 size={13} color="var(--emerald-pass)" />
              <span>Engine Mode</span>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111', marginTop: '0.35rem' }}>
              {telemetry?.active_model?.includes('claude') ? 'Bedrock Claude 3.5' : 'Hybrid AWS'}
            </div>
          </div>
        </div>

        {/* Live Session Trace List */}
        <h4 style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
          Recent Invocations & Telemetry Traces:
        </h4>
        <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontFamily: 'var(--font-mono)' }}>
          {telemetry?.recent_traces && telemetry.recent_traces.length > 0 ? (
            telemetry.recent_traces.map((trace, idx) => (
              <div
                key={idx}
                style={{
                  background: '#FBFBFB',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  padding: '0.55rem 0.85rem',
                  fontSize: '0.72rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ color: '#111', fontWeight: 600 }}>{trace.action}</span>
                  <span style={{ color: '#888', marginLeft: '0.5rem' }}>
                    {trace.model_id}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.85rem', color: '#666' }}>
                  <span>{trace.latency_ms}ms</span>
                  <span>{trace.prompt_tokens + trace.completion_tokens} toks</span>
                  <span style={{ color: 'var(--emerald-pass)', fontWeight: 600 }}>{trace.status}</span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#999', fontSize: '0.8rem' }}>
              No invocation traces recorded yet. Run requirement extraction or verification to observe live telemetry.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button className="btn-v1 btn-white" onClick={onClose}>
            Close HUD
          </button>
        </div>
      </div>
    </div>
  );
};
