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

4. AI Coding Agent Integration:
Builders must demonstrate that an AI coding agent (e.g. Agent Toolkit for AWS, Claude Code, Cursor, Kiro) was connected to AWS during development.

5. Technical Precision:
Verification logic must be deterministic and verifiable, reaching at least 90% accuracy benchmark.

6. Modern Runtime Environment:
Backend execution environment must run on modern serverless architecture using Python >= 3.12.`;

export const RequirementModal: React.FC<RequirementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
}) => {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-[#EEEEEE] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEEEEE]">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#111111]" />
            <h3 className="text-base font-semibold text-[#111111]">
              Add Requirements & Rules
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
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#444444] uppercase tracking-wide">
              Guidelines / Rubric Text
            </label>
            <button
              onClick={() => setText(SAMPLE_AWS_REQUIREMENTS)}
              className="inline-flex items-center gap-1.5 text-xs text-[#06B6D4] hover:text-[#0891B2] font-medium cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Zero to Shipped Sample</span>
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Paste submission criteria, judging rubric, or compliance guidelines here..."
            className="w-full p-3.5 bg-[#F9F9F9] border border-[#E5E5E5] focus:border-[#111111] rounded-xl text-xs font-mono focus:bg-white transition-all text-[#111111] resize-none focus:outline-none"
          />

          <p className="text-[11px] text-[#888888] leading-relaxed">
            Chronicle Ledger converts guidelines into structured rules, then checks your supporting material deterministically against each rule.
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
            onClick={() => onSubmit(text)}
            disabled={loading || !text.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#111111] hover:bg-black text-white text-xs font-medium cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Extracting Rules...' : 'Extract Rules'}
          </button>
        </div>
      </div>
    </div>
  );
};
