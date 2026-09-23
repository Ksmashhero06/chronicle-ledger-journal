'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChronicleLogo } from '@/components/chronicle-logo';
import { AlertCircle, RotateCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const refId = error.digest ? `CL-${error.digest.slice(0, 6).toUpperCase()}` : 'CL-500ERR';

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#111111] flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-[#111111] selection:text-white">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-4xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 group">
          <ChronicleLogo className="w-6 h-6 text-[#111111] group-hover:scale-105 transition-transform" />
          <span className="font-semibold text-sm tracking-tight text-[#111111]">
            Chronicle Ledger
          </span>
        </Link>
        <span className="text-[11px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 uppercase tracking-wider font-semibold">
          Error Encountered
        </span>
      </header>

      {/* Main Error Content */}
      <main className="max-w-xl mx-auto w-full my-auto py-12 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5E5E5] shadow-2xs flex items-center justify-center mx-auto text-[#666666]">
          <AlertCircle className="w-7 h-7 text-[#D9534F]" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#888888]">
            Unexpected Operation State
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#111111] tracking-tight">
            Something went wrong.
          </h1>
          <p className="text-sm text-[#666666] leading-relaxed max-w-md mx-auto">
            The requested verification or action could not be completed. Your previously saved requirements and evidence records have not been changed.
          </p>
        </div>

        {/* Primary User Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#DDDDDD] bg-white hover:bg-[#F5F5F5] text-xs text-[#111111] font-semibold transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>
        </div>

        {/* Reference & Progressive Technical Disclosure */}
        <div className="pt-6 border-t border-[#EEEEEE] space-y-3">
          <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-[#888888]">
            <span>Reference: <strong className="text-[#111111]">{refId}</strong></span>
            <span>•</span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-[#111111] hover:underline flex items-center gap-1 cursor-pointer font-sans font-medium text-xs"
            >
              <span>{showDetails ? 'Hide details' : 'Technical details'}</span>
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showDetails && (
            <div className="p-4 rounded-xl bg-[#F5F5F5] border border-[#E5E5E5] text-left text-xs font-mono text-[#444444] space-y-2 animate-in fade-in duration-150 max-w-md mx-auto">
              <div className="flex justify-between border-b border-[#E0E0E0] pb-1 text-[11px] text-[#666666]">
                <span>Status: Client Exception</span>
                <span>ID: {refId}</span>
              </div>
              <p className="text-[11px] text-[#111111] font-sans break-words">
                {error.message || 'An unhandled application error occurred during rendering.'}
              </p>
              <p className="text-[10px] text-[#888888] font-sans italic">
                No credentials, tokens, or private evidence contents are transmitted in this diagnostic view.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-[#999999] max-w-4xl mx-auto w-full font-mono">
        Chronicle Ledger • Evidence-Grounded Verification
      </footer>
    </div>
  );
}
