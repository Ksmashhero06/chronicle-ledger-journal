import React, { useState } from 'react';
import { X, Sparkles, FileText } from 'lucide-react';

interface RequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rawText: string) => void;
  loading: boolean;
}

const SAMPLE_AWS_REQUIREMENTS = `AWS Builder Center — Zero to Shipped 2026 Competition Requirements:

1. Category & Lane Qualification:
The submission must target #workplace-efficiency under the #community lane.

2. Original Application Gate:
The submitted project must be an original application that has not been published or deployed before.

3. Live Public AWS Deployment:
The application must be deployed publicly on AWS (CloudFront, Amplify, App Runner, or Lambda + API Gateway) and accessible by judges.

4. AI Coding Agent Integration Proof:
Builders must demonstrate verifiable proof that an AI coding agent (e.g. Agent Toolkit for AWS, Claude Code, Cursor, Kiro) was connected to AWS during development.

5. Technical Innovation & Precision:
Verification logic must be deterministic and verifiable, reaching at least 90% accuracy benchmark.

6. Modern Runtime Environment:
Backend execution environment must run on modern serverless architecture using Python >= 3.12.`;

export const RequirementModal: React.FC<RequirementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
}) => {
  const [text, setText] = useState<string>(SAMPLE_AWS_REQUIREMENTS);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111' }}>Extract Structured Requirements</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: '#666', marginBottom: '1rem', lineHeight: 1.5 }}>
          Paste competition briefs, guidelines, or RFPs. Amazon Bedrock parses natural language into strongly-typed Pydantic rules for numeric thresholds, presence checks, and assertions.
        </p>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#333' }}>Requirement Text or Guidelines</label>
            <button
              className="btn-v1 btn-white"
              onClick={() => setText(SAMPLE_AWS_REQUIREMENTS)}
              style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}
            >
              <Sparkles size={12} />
              <span>Load Zero to Shipped 2026 Sample</span>
            </button>
          </div>

          <textarea
            className="textarea-v1"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your requirements document here..."
            rows={10}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
          <button className="btn-v1 btn-white" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn-v1 btn-black" onClick={() => onSubmit(text)} disabled={loading || !text.trim()}>
            {loading ? 'Extracting via Bedrock...' : 'Extract Requirements'}
          </button>
        </div>
      </div>
    </div>
  );
};
