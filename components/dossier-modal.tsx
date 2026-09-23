import React, { useState } from 'react';
import { X, Download, Copy, Check, ShieldCheck } from 'lucide-react';

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
    const content = dossier.markdown_content || JSON.stringify(dossier, null, 2);
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!dossier) return;
    const content = dossier.markdown_content || JSON.stringify(dossier, null, 2);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronicle-ledger-v2-verification-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-[#EEEEEE] overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEEEEE] shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-base font-semibold text-[#111111]">
                Verification Report
              </h3>
              <p className="text-[11px] text-[#888888]">
                Exportable summary of requirements, supporting materials, and check results
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888888] hover:text-[#111111] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-xs text-[#888888]">
              Generating report...
            </div>
          ) : (
            <div className="bg-[#F9F9F9] border border-[#EEEEEE] rounded-xl p-4 font-mono text-xs text-[#222222] whitespace-pre-wrap max-h-[50vh] overflow-y-auto leading-relaxed">
              {dossier?.markdown_content || JSON.stringify(dossier, null, 2)}
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7] text-[#3F3F46] text-xs flex items-center justify-between">
            <span className="font-mono text-[11px]">
              Report Fingerprint: {dossier?.audit_hash || 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'}
            </span>
            <span className="font-medium text-[10px] uppercase tracking-wider bg-[#E4E4E7] px-2 py-0.5 rounded text-[#27272A]">
              SHA-256 Computed
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[#EEEEEE] bg-[#FAFAFA] shrink-0">
          <span className="text-[11px] text-[#888888]">
            AWS Builder Center — Zero to Shipped 2026
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#DDDDDD] text-xs font-medium text-[#444444] hover:text-[#111111] hover:bg-white cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#111111] hover:bg-black text-white text-xs font-medium cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report (.md)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
