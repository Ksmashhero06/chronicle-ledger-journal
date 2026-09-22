import React, { useState } from 'react';
import { X, Upload, Sparkles } from 'lucide-react';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (filename: string, fileType: string, contentText: string) => void;
  loading: boolean;
}

const SAMPLE_EVIDENCE = `Chronicle Ledger v2 - Technical Evaluation, Benchmark & Deployment Report
Project: Chronicle Ledger v2 (#workplace-efficiency / #community)

1. Original Application Status:
Chronicle Ledger v2 is a newly architected AWS-native requirement verification platform, independently designed and built for Zero to Shipped 2026.

2. Deterministic Verification Performance Benchmarks:
Evaluation benchmark accuracy reached 92.4% on complex rule parsing tests, exceeding standard requirements.
Median latency observed was 142ms across serverless Lambda execution runs.

3. Live Public AWS Deployment:
Production endpoint live on AWS CloudFront / API Gateway:
https://chronicle-ledger-v2.awsapps.com
All health checks passing across us-east-1 serverless cluster.

4. AI Coding Agent Telemetry Traces:
Built using AWS Agent Toolkit with 14 documented telemetry spans authenticated on Amazon Bedrock (Claude 3.5 Sonnet).`;

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
}) => {
  const [filename, setFilename] = useState('submission_proof.txt');
  const [fileType, setFileType] = useState('TEXT');
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-[#EEEEEE] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEEEEE]">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#111111]" />
            <h3 className="text-base font-semibold text-[#111111]">
              Attach Evidence Artifact
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888888] hover:text-[#111111] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#444444] uppercase tracking-wide block mb-1">
                Artifact Filename
              </label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full p-2.5 bg-[#F9F9F9] border border-[#E5E5E5] focus:border-[#111111] rounded-xl text-xs text-[#111111] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#444444] uppercase tracking-wide block mb-1">
                Evidence Format
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full p-2.5 bg-[#F9F9F9] border border-[#E5E5E5] focus:border-[#111111] rounded-xl text-xs text-[#111111] focus:outline-none"
              >
                <option value="TEXT">Plaintext / Log</option>
                <option value="MARKDOWN">Markdown Dossier</option>
                <option value="JSON">Structured JSON</option>
                <option value="GIT_LOG">Git Log Dump</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-[#444444] uppercase tracking-wide">
              Raw Evidence Content
            </label>
            <button
              onClick={() => setContent(SAMPLE_EVIDENCE)}
              className="inline-flex items-center gap-1.5 text-xs text-[#06B6D4] hover:text-[#0891B2] font-medium cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Zero to Shipped 2026 Sample</span>
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder="Paste logs, benchmark outputs, deployment URLs, or audit traces..."
            className="w-full p-3.5 bg-[#F9F9F9] border border-[#E5E5E5] focus:border-[#111111] rounded-xl text-xs font-mono focus:bg-white transition-all text-[#111111] resize-none focus:outline-none"
          />

          <p className="text-[11px] text-[#888888] leading-relaxed">
            All evidence artifacts are cryptographically fingerprinted using SHA-256 with exact verbatim character offsets.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#EEEEEE] bg-[#FAFAFA]">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-full border border-[#DDDDDD] text-xs font-medium text-[#666666] hover:text-[#111111] hover:bg-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(filename, fileType, content)}
            disabled={loading || !content.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#111111] hover:bg-black text-white text-xs font-medium cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Fingerprinting...' : 'Fingerprint & Store Evidence'}
          </button>
        </div>
      </div>
    </div>
  );
};
